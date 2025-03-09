import { UUID } from "crypto";

export interface GSXProfile {
    id: UUID,
    status: boolean,
    applied?: boolean,
    continent: string,
    country: string,
    airportIcaoCode: string,
    airportDeveloper?: string | undefined,
    profileVersion?: string | undefined,
    additionalInfo?: string | undefined,
    fstoLink?: string | undefined,
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
    READY_TO_LINK = 'Ready to link',
    NOT_SYNCED = 'Not Selected',
    SYNCED = 'Linked',
}