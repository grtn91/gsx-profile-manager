import React, { useState, useEffect } from 'react';
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
import { LocationOption, ProfileFormValues } from '@/types/common';
import { useProfileStore } from '@/store/useGsxProfileStore';

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
}) => {
    const watchContinent = form.watch('continent');
    const watchCountry = form.watch('country');
    const [commonDeveloper, setCommonDeveloper] = useState<string[] | null>(null);
    const [airportIcaoCode, setAirportIcaoCode] = useState<string[] | null>(null);
    const [countries, setCountries] = useState<string[] | null>(null);

    const { getAllAirportIcaoCodes, getAllAirportDevelopers, getAllCountries } = useProfileStore();


    useEffect(() => {
        setCommonDeveloper(getAllAirportDevelopers());
        setAirportIcaoCode(getAllAirportIcaoCodes());
        setCountries(getAllCountries());
    }, []);


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

            {/* Country Input with Autocomplete */}
            <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input
                                    list="countryOptions"
                                    placeholder="e.g. United States"
                                    {...field}
                                    disabled={!watchContinent}
                                    autoComplete="off"
                                />
                                <datalist id="countryOptions">
                                    {countries?.map(country => (
                                        <option key={country} value={country}>
                                            {country}
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* ICAO Code Input with Autocomplete */}
            <FormField
                control={form.control}
                name="airportIcaoCode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>ICAO Code</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input
                                    list="icaoOptions"
                                    placeholder="e.g. KJFK"
                                    {...field}
                                    disabled={!watchCountry}
                                    className="uppercase"
                                    autoComplete="off"
                                />
                                <datalist id="icaoOptions">
                                    {airportIcaoCode?.map(icaoCode => (
                                        <option key={icaoCode} value={icaoCode}>
                                            {icaoCode}
                                        </option>
                                    ))}
                                </datalist>
                            </div>
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
                            <div className="relative">
                                <Input
                                    list="developerOptions"
                                    placeholder="e.g. FlyTampa"
                                    {...field}
                                    autoComplete="off"
                                />
                                <datalist id="developerOptions">
                                    {commonDeveloper?.map(dev => (
                                        <option key={dev} value={dev} />
                                    ))}
                                </datalist>
                            </div>
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
                            <Input autoComplete="off" placeholder="e.g. 1.0.2" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};