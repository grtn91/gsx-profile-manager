import { LocationOption } from '@/types/common';

// Continents for the dropdown
export const CONTINENTS: LocationOption[] = [
    { value: "europe", label: "Europe" },
    { value: "north-america", label: "North America" },
    { value: "south-america", label: "South America" },
    { value: "asia", label: "Asia" },
    { value: "africa", label: "Africa" },
    { value: "oceania", label: "Oceania" },
    { value: "antarctica", label: "Antarctica" },
];

// Countries grouped by continent
export const COUNTRIES: Record<string, LocationOption[]> = {
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

// ICAO codes grouped by country
export const AIRPORT_ICAO_CODES: Record<string, LocationOption[]> = {
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