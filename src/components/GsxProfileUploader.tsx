import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from './ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from './ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Upload, FileType } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Mock data for dropdown options
const continents = [
    { value: "europe", label: "Europe" },
    { value: "north-america", label: "North America" },
    { value: "south-america", label: "South America" },
    { value: "asia", label: "Asia" },
    { value: "africa", label: "Africa" },
    { value: "oceania", label: "Oceania" },
    { value: "antarctica", label: "Antarctica" },
];

// Mock sample of countries (you would expand this with a full list)
const countries = {
    "europe": [
        { value: "germany", label: "Germany" },
        { value: "france", label: "France" },
        { value: "uk", label: "United Kingdom" },
        // More countries would be added here
    ],
    "north-america": [
        { value: "usa", label: "United States" },
        { value: "canada", label: "Canada" },
        { value: "mexico", label: "Mexico" },
        // More countries would be added here
    ],
    // More continents would have their own country lists
};

// Mock sample of ICAO codes (you would expand this with a full list)
const icaoCodes = {
    "germany": [
        { value: "eddf", label: "EDDF - Frankfurt" },
        { value: "eddm", label: "EDDM - Munich" },
        { value: "eddb", label: "EDDB - Berlin Brandenburg" },
    ],
    "france": [
        { value: "lfpg", label: "LFPG - Paris Charles de Gaulle" },
        { value: "lfpo", label: "LFPO - Paris Orly" },
        { value: "lfmn", label: "LFMN - Nice" },
    ],
    "usa": [
        { value: "kjfk", label: "KJFK - New York JFK" },
        { value: "klax", label: "KLAX - Los Angeles" },
        { value: "kord", label: "KORD - Chicago O'Hare" },
    ],
    // More countries would have their own ICAO code lists
};

// Form schema with validation
const formSchema = z.object({
    continent: z.string({
        required_error: "Please select a continent",
    }),
    country: z.string({
        required_error: "Please select a country",
    }),
    icaoCode: z.string({
        required_error: "Please select an ICAO code",
    }),
    airportDeveloper: z.string().optional(),
    profileVersion: z.string().optional(),
});

export function ProfileUploader() {
    const [files, setFiles] = useState<File[]>([]);
    const [availableCountries, setAvailableCountries] = useState<{value: string, label: string}[]>([]);
    const [availableIcaoCodes, setAvailableIcaoCodes] = useState<{value: string, label: string}[]>([]);

    // Initialize form
    const form = useForm<z.infer<typeof formSchema>>({
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
    React.useEffect(() => {
        if (watchContinent) {
            setAvailableCountries(countries[watchContinent as keyof typeof countries] || []);
            form.setValue('country', '');
            form.setValue('icaoCode', '');
            setAvailableIcaoCodes([]);
        }
    }, [watchContinent, form]);

    // Update available ICAO codes when country changes
    React.useEffect(() => {
        if (watchCountry) {
            setAvailableIcaoCodes(icaoCodes[watchCountry as keyof typeof icaoCodes] || []);
            form.setValue('icaoCode', '');
        }
    }, [watchCountry, form]);

    // Handle file drop
    const onDrop = useCallback((acceptedFiles: File[]) => {
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

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/x-python': ['.py'],
            'text/plain': ['.ini'],
        }
    });

    // Handle form submission
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        if (files.length === 0) {
            toast.error("Please add at least one profile file");
            return;
        }

        try {
            // Mock API call to backend
            console.log("Submitting profile data:", {
                ...data,
                files: files.map(f => f.name)
            });

            // This would be replaced with an actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success("Profile added successfully!");

            // Reset form
            form.reset();
            setFiles([]);
        } catch (error) {
            console.error("Error adding profile:", error);
            toast.error("Failed to add profile. Please try again.");
        }
    };

    // Remove a file from the list
    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
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
                        {/* File Drop Zone */}
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                ${files.length > 0 ? 'border-success bg-success/5' : ''}
              `}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center gap-2">
                                <Upload className={isDragActive ? 'text-primary' : 'text-muted-foreground'} size={36} />
                                {isDragActive ? (
                                    <p className="text-primary font-medium">Drop the files here...</p>
                                ) : (
                                    <>
                                        <p className="font-medium">Drag & drop GSX profile files here</p>
                                        <p className="text-sm text-muted-foreground">
                                            or click to select files (.py and .ini only)
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="border rounded-md p-3 bg-muted/30">
                                <h4 className="font-medium mb-2">Selected Files ({files.length})</h4>
                                <ul className="space-y-2 max-h-40 overflow-y-auto">
                                    {files.map((file, index) => (
                                        <li key={`${file.name}-${index}`} className="flex items-center justify-between text-sm p-2 rounded-md bg-background">
                                            <div className="flex items-center">
                                                <FileType className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>{file.name}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFile(index)}
                                                className="h-6 w-6 p-0"
                                            >
                                                &times;
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Continent Select */}
                            <FormField
                                control={form.control}
                                name="continent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Continent</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select continent" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {continents.map(continent => (
                                                        <SelectItem key={continent.value} value={continent.value}>
                                                            {continent.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Country Select */}
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={!watchContinent}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select country" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableCountries.map(country => (
                                                        <SelectItem key={country.value} value={country.value}>
                                                            {country.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* ICAO Code Select */}
                            <FormField
                                control={form.control}
                                name="icaoCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ICAO Code</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={!watchCountry}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select ICAO code" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableIcaoCodes.map(icao => (
                                                        <SelectItem key={icao.value} value={icao.value}>
                                                            {icao.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Airport Developer Input */}
                            <FormField
                                control={form.control}
                                name="airportDeveloper"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Airport Developer (optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. FlyTampa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Profile Version Input */}
                            <FormField
                                control={form.control}
                                name="profileVersion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Profile Version (optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 1.0.2" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={files.length === 0}>
                            Add Profile
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}