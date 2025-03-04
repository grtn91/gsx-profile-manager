import { UUID } from "crypto";

export interface GSXProfile {
    id: UUID,
    status: boolean,
    continent: string,
    country: string,
    airportIcaoCode: string,
    airportDeveloper?: string | undefined,
    profileVersion?: string | undefined,
    additionalInfo?: string | undefined,
    filePaths: string[],
    createdAt: Date;
    updatedAt: Date;
}

export interface File {
    name: string;
    path: string;
    size: number;
    type: string;
}

export type ProfileFormData = Omit<GSXProfile, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export enum SyncStatus {
    SYNCED = 'Synced',
    NOT_SYNCED = 'Not Synced'
}