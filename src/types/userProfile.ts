export interface UserProfile {
    id?: number;
    simbriefUsername: string;
    skipUpdate: boolean;
    skipUpdateUntil: Date | null;
    communityFolderAirports: string[];
    createdAt: Date;
    updatedAt: Date;
}