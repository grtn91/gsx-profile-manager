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
import { FileDropzone } from '@/components/ui/dropzone';
import { FileList } from '@/components/ui/file-list';
import { ProfileForm } from '@/components/ui/profile-form';
import { CONTINENTS, COUNTRIES, AIRPORT_ICAO_CODES } from '@/lib/constants';
import { LocationOption, ProfileFormValues, formSchema } from '@/types/common';
import { saveFilesToNestedPath } from '../utils/saveFilesToNestedPath';
import { useProfileStore } from '@/store/useGsxProfileStore';
import { GSXProfile } from '@/types/gsx-profile';

interface ProfileUploaderProps {
    onSuccess?: () => void;
}

export const ProfileUploader: React.FC<ProfileUploaderProps> = ({ onSuccess }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [availableCountries, setAvailableCountries] = useState<LocationOption[]>([]);
    const [availableIcaoCodes, setAvailableIcaoCodes] = useState<LocationOption[]>([]);

    const { addProfile } = useProfileStore();

    // Initialize form
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            continent: "",
            country: "",
            airportIcaoCode: "",
            airportDeveloper: "",
            profileVersion: ""
        },
    });

    // Watch form values to update dependent selects
    const watchContinent = form.watch('continent');
    const watchCountry = form.watch('country');

    const isDuplicateFile = (newFile: File, existingFiles: File[]): boolean => {
        return existingFiles.some(existingFile => existingFile.name === newFile.name);
    };

    // Update available countries when continent changes
    useEffect(() => {
        if (watchContinent) {
            setAvailableCountries(COUNTRIES[watchContinent] || []);
            form.setValue('country', '');
            form.setValue('airportIcaoCode', '');
            setAvailableIcaoCodes([]);
        }
    }, [watchContinent, form]);

    // Update available ICAO codes when country changes
    useEffect(() => {
        if (watchCountry) {
            setAvailableIcaoCodes(AIRPORT_ICAO_CODES[watchCountry] || []);
            form.setValue('airportIcaoCode', '');
        }
    }, [watchCountry, form]);

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

    // Handle form submission
    const onSubmit = async (data: ProfileFormValues) => {
        try {
            // Create a nested path structure
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

            // Generate full file paths including filenames
            const fullFilePaths = await Promise.all(
                files.map(async file => await path.join(profileDir, file.name))
            );

            const profileData: GSXProfile = {
                ...data,
                filePaths: fullFilePaths, // Store complete paths with filenames
                id: crypto.randomUUID(), // Generate a unique ID for the profile
                createdAt: new Date(),
                status: false,
                updatedAt: new Date()
            };


            const data2 = await addProfile(profileData);
            console.log("Saved profile data:", data2);
            toast.success(`Profile saved to ${profileDir} !`);

            // Reset form and files
            form.reset();
            setFiles([]);

            // Close the modal by calling the onSuccess callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error(`Failed to save profile: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <Card className="w-full mb-8">
            <CardHeader>
                <CardTitle>Add GSX Profile</CardTitle>
                <CardDescription>
                    Upload GSX profile files (.py and .ini) and provide profile details
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FileDropzone onFilesAdded={handleFilesAdded} />

                        <FileList
                            files={files}
                            onRemoveFile={handleRemoveFile}
                        />

                        <ProfileForm
                            form={form}
                            continents={CONTINENTS}
                            countries={availableCountries}
                            icaoCodes={availableIcaoCodes}
                            hasFiles={files.length > 0}
                        />
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default ProfileUploader;