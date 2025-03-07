import { UUID } from 'crypto';
import { z } from 'zod';


// Form validation schema
export const formSchema = z.object({
    continent: z.string({
        required_error: "Please select a continent",
    }),
    country: z.string({
        required_error: "Please select a country",
    }),
    airportIcaoCode: z.string({
        required_error: "Please select an ICAO code",
    }),
    airportDeveloper: z.string().optional(),
    profileVersion: z.string().optional(),
    fstoLink: z.string().optional(),
});

// Database interface
export interface Database {
    db?: {
        execute: (query: string, params?: any[]) => Promise<any>;
    };
    execute: (query: string, params?: any[]) => Promise<any>;
}

// Location option type
export interface LocationOption {
    value: string;
    label: string;
}

// File with additional properties
export interface FileWithDetails extends File {
    id?: UUID;
    batchId?: UUID;
    content?: Promise<string>;
    savedPath?: string;
}

// Form data type from zod schema
export type ProfileFormValues = z.infer<typeof formSchema>;



