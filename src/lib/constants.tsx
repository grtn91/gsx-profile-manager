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
        { value: "italy", label: "Italy" },
        { value: "spain", label: "Spain" },
        { value: "netherlands", label: "Netherlands" },
        { value: "sweden", label: "Sweden" },
    ],
    "north-america": [
        { value: "usa", label: "United States" },
        { value: "canada", label: "Canada" },
        { value: "mexico", label: "Mexico" },
    ],
    "south-america": [
        { value: "brazil", label: "Brazil" },
        { value: "argentina", label: "Argentina" },
        { value: "colombia", label: "Colombia" },
        { value: "chile", label: "Chile" },
    ],
    "asia": [
        { value: "china", label: "China" },
        { value: "japan", label: "Japan" },
        { value: "india", label: "India" },
        { value: "south-korea", label: "South Korea" },
        { value: "thailand", label: "Thailand" },
    ],
    "africa": [
        { value: "south-africa", label: "South Africa" },
        { value: "nigeria", label: "Nigeria" },
        { value: "egypt", label: "Egypt" },
        { value: "kenya", label: "Kenya" },
    ],
    "oceania": [
        { value: "australia", label: "Australia" },
        { value: "new-zealand", label: "New Zealand" },
    ],
};

// ICAO codes grouped by country
export const AIRPORT_ICAO_CODES: Record<string, LocationOption[]> = {
    "germany": [
        { value: "eddf", label: "EDDF - Frankfurt" },
        { value: "eddm", label: "EDDM - Munich" },
        { value: "eddb", label: "EDDB - Berlin Brandenburg" },
        { value: "eddr", label: "EDDR - Saarbrücken" },
        { value: "eddh", label: "EDDH - Hamburg" },
    ],
    "france": [
        { value: "lfpg", label: "LFPG - Paris Charles de Gaulle" },
        { value: "lfpo", label: "LFPO - Paris Orly" },
        { value: "lfmn", label: "LFMN - Nice" },
        { value: "lfll", label: "LFLL - Lyon" },
        { value: "lfbo", label: "LFBO - Toulouse" },
    ],
    "usa": [
        { value: "kjfk", label: "KJFK - New York JFK" },
        { value: "klax", label: "KLAX - Los Angeles" },
        { value: "kord", label: "KORD - Chicago O'Hare" },
        { value: "ksfo", label: "KSFO - San Francisco" },
        { value: "kmia", label: "KMIA - Miami" },
    ],
    "china": [
        { value: "zbaa", label: "ZBAA - Beijing Capital" },
        { value: "zspd", label: "ZSPD - Shanghai Pudong" },
        { value: "zggg", label: "ZGGG - Guangzhou Baiyun" },
        { value: "zuhh", label: "ZUUU - Chengdu Shuangliu" },
        { value: "zgsz", label: "ZGSZ - Shenzhen Bao'an" },
    ],
    "australia": [
        { value: "yssy", label: "YSSY - Sydney" },
        { value: "ymml", label: "YMML - Melbourne" },
        { value: "ybbn", label: "YBBN - Brisbane" },
        { value: "ypph", label: "YPPH - Perth" },
        { value: "yadl", label: "YADL - Adelaide" },
    ],
    "japan": [
        { value: "rjtt", label: "RJTT - Tokyo Haneda" },
        { value: "rjbb", label: "RJBB - Kansai" },
        { value: "rjcc", label: "RJCC - Sapporo" },
    ],
};
