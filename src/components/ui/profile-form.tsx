import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LocationOption, ProfileFormValues } from '@/types/common';

interface ProfileFormProps {
    form: UseFormReturn<ProfileFormValues>;
    continents: LocationOption[];
    countries: LocationOption[];
    icaoCodes: LocationOption[];
    hasFiles: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
    form,
    continents,
    countries,
    icaoCodes,
    hasFiles
}) => {
    const watchContinent = form.watch('continent');
    const watchCountry = form.watch('country');

    const checkButtonDisabled = () => {
        if (!hasFiles) return true;
        if (!watchContinent) return true;
        if (!watchCountry) return true;
        if (!form.getValues('airportIcaoCode')) return true;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    {countries.map(country => (
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
                name="airportIcaoCode"
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
                                    {icaoCodes.map(icao => (
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

            <div>
                <h2 className="text-sm font-medium mb-1.5">Add Profile</h2>
                <Button type="submit" className="w-full" disabled={checkButtonDisabled()}>
                    Add Profile
                </Button>
            </div>
        </div>
    );
};