import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useDatabase } from '@/context/Database';
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
import { FileWithDetails, LocationOption, ProfileFormValues, formSchema } from '@/types/common';

export const ProfileUploader: React.FC = () => {
    const [files, setFiles] = useState<FileWithDetails[]>([]);
    const [availableCountries, setAvailableCountries] = useState<LocationOption[]>([]);
    const [availableIcaoCodes, setAvailableIcaoCodes] = useState<LocationOption[]>([]);

    // Initialize form
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            continent: "",
            country: "",
            icaoCode: "",
            airportDeveloper: "",
            profileVersion: ""
        },
    });

    // Watch form values to update dependent selects
    const watchContinent = form.watch('continent');
    const watchCountry = form.watch('country');

    // Update available countries when continent changes
    useEffect(() => {
        if (watchContinent) {
            setAvailableCountries(COUNTRIES[watchContinent] || []);
            form.setValue('country', '');
            form.setValue('icaoCode', '');
            setAvailableIcaoCodes([]);
        }
    }, [watchContinent, form]);

    // Update available ICAO codes when country changes
    useEffect(() => {
        if (watchCountry) {
            setAvailableIcaoCodes(AIRPORT_ICAO_CODES[watchCountry] || []);
            form.setValue('icaoCode', '');
        }
    }, [watchCountry, form]);

    // Handle file drop
    const handleFilesAdded = useCallback((acceptedFiles: File[]) => {
        const validFiles = acceptedFiles.filter(
            file => file.name.endsWith('.py') || file.name.endsWith('.ini')
        );

        if (validFiles.length !== acceptedFiles.length) {
            toast.error("Some files were rejected. Only .py and .ini files are allowed.");
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            toast.success(`Added ${validFiles.length} file(s)`);
        }
    }, []);

    // Remove a file from the list
    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Handle form submission
    const onSubmit = async (data: ProfileFormValues) => {
        // Implementation for saving profile will go here
        toast.info("Profile submission will be implemented soon!");
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