// Define the interface for a single row
interface ProfileRow {
    id: string;
    continent: string;
    country: string;
    airportIcaoCode: string;
    airportDeveloper: string | null;
    profileVersion: string | null;
    filePaths: string;
    status: number;
    createdAt: string;
    updatedAt: string;
}