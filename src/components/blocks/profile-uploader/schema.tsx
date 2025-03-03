import * as z from 'zod';

// Form validation schema
export const formSchema = z.object({
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