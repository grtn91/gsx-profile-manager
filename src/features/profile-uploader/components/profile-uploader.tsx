import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { path } from '@tauri-apps/api';
import { appDataDir } from '@tauri-apps/api/path';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/ui/dropzone';
import { FileList } from '@/components/ui/file-list';
import { ProfileForm } from '@/components/ui/profile-form';
import { CONTINENTS, COUNTRIES, AIRPORT_ICAO_CODES } from '@/lib/constants';
import { LocationOption, ProfileFormValues, formSchema } from '@/types/common';
import { saveFilesToNestedPath } from '@/lib/fileSystem';
import { useProfileStore } from '@/store/useGsxProfileStore';
import { GSXProfile } from '@/types/gsx-profile';
import { getRelativePath } from '@/lib/utils';
import { X } from 'lucide-react';

interface ProfileUploaderProps {
    onSuccess?: () => void;
    existingProfile?: GSXProfile;
}

export const ProfileUploader: React.FC<ProfileUploaderProps> = ({ onSuccess, existingProfile }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [availableCountries, setAvailableCountries] = useState<LocationOption[]>([]);
    const [availableIcaoCodes, setAvailableIcaoCodes] = useState<LocationOption[]>([]);
    const [existingFilesToKeep, setExistingFilesToKeep] = useState<string[]>(
        existingProfile?.filePaths || []
    );


    const { addProfile, updateProfile } = useProfileStore();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: existingProfile ? {
            continent: existingProfile.continent,
            country: existingProfile.country,
            airportIcaoCode: existingProfile.airportIcaoCode,
            airportDeveloper: existingProfile.airportDeveloper || "",
            profileVersion: existingProfile.profileVersion || "",
            fstoLink: existingProfile.fstoLink || "",
        } : {
            continent: "",
            country: "",
            airportIcaoCode: "",
            airportDeveloper: "",
            profileVersion: "",
            fstoLink: "",
        },
    });

    // More comprehensive button disabled check
    const checkButtonDisabled = () => {
        // Check for files
        const hasFiles = existingProfile
            ? existingFilesToKeep.length > 0 || files.length > 0
            : files.length > 0;
        if (!hasFiles) return true;

        // Check required form fields
        if (!watchContinent) return true;
        if (!watchCountry) return true;
        if (!watchIcaoCode) return true;

        // Check for form submission in progress
        if (form.formState.isSubmitting) return true;

        // All checks passed, button should be enabled
        return false;
    };

    // Watch form values for validation
    const watchContinent = form.watch('continent');
    const watchCountry = form.watch('country');
    const watchIcaoCode = form.watch('airportIcaoCode');

    // If editing, populate the dropdown options based on the existing profile
    useEffect(() => {
        if (existingProfile) {
            // Populate countries dropdown for the selected continent
            if (existingProfile.continent) {
                setAvailableCountries(COUNTRIES[existingProfile.continent] || []);
            }

            // Populate ICAO codes dropdown for the selected country
            if (existingProfile.country) {
                setAvailableIcaoCodes(AIRPORT_ICAO_CODES[existingProfile.country] || []);
            }

            // Set the list of existing files
            setExistingFilesToKeep(existingProfile.filePaths);
        }
    }, [existingProfile]);

    const isDuplicateFile = (newFile: File, existingFiles: File[]): boolean => {
        return existingFiles.some(existingFile => existingFile.name === newFile.name);
    };

    // Update available countries when continent changes
    useEffect(() => {
        if (watchContinent) {
            setAvailableCountries(COUNTRIES[watchContinent] || []);
            // Only reset country if different from existing profile
            if (!existingProfile || watchContinent !== existingProfile.continent) {
                form.setValue('country', '');
                form.setValue('airportIcaoCode', '');
                setAvailableIcaoCodes([]);
            }
        }
    }, [watchContinent, form, existingProfile]);

    // Update available ICAO codes when country changes
    useEffect(() => {
        if (watchCountry) {
            setAvailableIcaoCodes(AIRPORT_ICAO_CODES[watchCountry] || []);
            // Only reset ICAO if different from existing profile
            if (!existingProfile || watchCountry !== existingProfile.country) {
                form.setValue('airportIcaoCode', '');
            }
        }
    }, [watchCountry, form, existingProfile]);

    // Handle file drop - updated with duplicate checking
    const handleFilesAdded = useCallback(async (acceptedFiles: File[]) => {
        // Filter out duplicates
        const uniqueFiles = acceptedFiles.filter(file => !isDuplicateFile(file, files));
        const duplicateFiles = acceptedFiles.filter(file => isDuplicateFile(file, files));

        // Only add unique files to state
        if (uniqueFiles.length > 0) {
            setFiles(prev => [...prev, ...uniqueFiles]);
            toast.success(`${uniqueFiles.length} file(s) uploaded successfully!`);
        }

        // Notify about duplicates
        if (duplicateFiles.length > 0) {
            const duplicateNames = duplicateFiles.map(file => file.name).join(", ");
            toast.warning(`Skipped ${duplicateFiles.length} duplicate file(s): ${duplicateNames}`);
        }
    }, [files]);

    // Remove a file from the list
    const handleRemoveFile = async (index: number) => {
        try {
            setFiles(prev => prev.filter((_, i) => i !== index));
        } catch (error) {
            console.error("Error removing file:", error);
            toast.error(`Failed to remove file: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // Remove an existing file
    const handleRemoveExistingFile = (filePath: string) => {
        setExistingFilesToKeep(prev => prev.filter(path => path !== filePath));
    };

    // Handle form submission
    const onSubmit = async (data: ProfileFormValues) => {
        try {
            if (existingProfile) {
                // Update existing profile
                let updatedFilePaths = [...existingFilesToKeep];

                if (files.length > 0) {
                    const profileDir = await saveFilesToNestedPath(files, {
                        basePath: await appDataDir(),
                        rootFolder: "gsx-profiles",
                        segments: [
                            data.continent,
                            data.country.toLowerCase(),
                            data.airportIcaoCode.toLowerCase(),
                            data.airportDeveloper?.trim() || undefined,
                            data.profileVersion?.trim() || undefined,
                        ]
                    });

                    // Generate full file paths including filenames
                    const newFilePaths = await Promise.all(
                        files.map(async file => await path.join(profileDir, file.name))
                    );

                    // Combine existing and new file paths
                    updatedFilePaths = [...existingFilesToKeep, ...newFilePaths];
                }

                await updateProfile(existingProfile.id, {
                    ...existingProfile,
                    ...data,
                    filePaths: updatedFilePaths
                });

                toast.success("Profile updated successfully");

                // Call onSuccess to close modal if provided
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                // Create new profile logic (unchanged)
                const baseDir = await appDataDir();

                const pathConfig = {
                    basePath: baseDir,
                    rootFolder: "gsx-profiles",
                    segments: [
                        data.continent,
                        data.country.toLowerCase(),
                        data.airportIcaoCode.toLowerCase(),
                        data.airportDeveloper?.trim() || undefined,
                        data.profileVersion?.trim() || undefined
                    ]
                };

                const profileDir = await saveFilesToNestedPath(files, pathConfig);

                const fullFilePaths = await Promise.all(
                    files.map(async file => await path.join(profileDir, file.name))
                );

                const profileData: GSXProfile = {
                    ...data,
                    filePaths: fullFilePaths,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                    status: false,
                    updatedAt: new Date()
                };

                await addProfile(profileData);
                toast.success(`Profile saved successfully!`);

                if (onSuccess) {
                    onSuccess();
                }

                form.reset();
                setFiles([]);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error(`Failed to save profile: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // Check if we have files for the form validation
    const hasAnyFiles = existingProfile
        ? existingFilesToKeep.length > 0 || files.length > 0
        : files.length > 0;

    return (
        <Card className="w-full mb-8">
            <CardHeader>
                <CardTitle>{existingProfile ? 'Update GSX Profile' : 'Store GSX Profile'}</CardTitle>
                <CardDescription>
                    {existingProfile
                        ? 'Edit profile details or manage attached files (add/remove)'
                        : 'Store GSX profile files (.py, .ini) and enter profile details'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* File upload area */}
                        <FileDropzone onFilesAdded={handleFilesAdded} />

                        {/* Show existing files with delete option when editing */}
                        {existingProfile && existingFilesToKeep.length > 0 && (
                            <div className="border rounded-md p-4">
                                <h3 className="text-sm font-medium mb-2">Current Files:</h3>
                                <div className="space-y-1">
                                    {existingFilesToKeep.map((filePath, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between text-sm py-1 group"
                                        >
                                            <span className="text-muted-foreground">
                                                {getRelativePath(filePath)}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveExistingFile(filePath)}
                                                className="opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                <span className="sr-only">Remove file</span>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New files list */}
                        {files.length > 0 && (
                            <FileList
                                files={files}
                                onRemoveFile={handleRemoveFile}
                            />
                        )}

                        {/* Profile form */}
                        <ProfileForm
                            form={form}
                            continents={CONTINENTS}
                            countries={availableCountries}
                            icaoCodes={availableIcaoCodes}
                            hasFiles={hasAnyFiles}
                        />

                        {/* Submit button */}
                        <Button
                            type="submit"
                            disabled={checkButtonDisabled()}
                            className="w-full"
                        >
                            {existingProfile ? 'Update Profile' : 'Store Profile'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default ProfileUploader;