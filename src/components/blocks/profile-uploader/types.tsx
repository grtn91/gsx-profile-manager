import { z } from 'zod';
import { formSchema } from './schema';

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
    id?: string;
}

// Form data type from zod schema
export type ProfileFormValues = z.infer<typeof formSchema>;