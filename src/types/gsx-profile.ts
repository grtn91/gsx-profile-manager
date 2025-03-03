import { UUID } from "crypto";

export interface GSXProfile {
    id: UUID,
    status: boolean,
    continent: string,
    country: string,
    airportIcaoCode: string,
    developer: string,
    version: string,
    files: File[],
}