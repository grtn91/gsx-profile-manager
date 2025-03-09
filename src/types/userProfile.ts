export interface UserProfile {
    id?: number;
    simbriefUsername?: string;
    skipUpdate: boolean;
    skipUpdateUntil: Date | null;
    communityFolderAirports: string[];
    ignoredAirports?: string[];
    createdAt: Date;
    updatedAt: Date;
}