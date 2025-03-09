import { UserProfile } from "@/types/userProfile";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getUserProfile, updateUserProfile } from "@/lib/db";

interface UserProfileState {
    // Profile data
    profile: UserProfile | null;

    // Status flags
    isLoading: boolean;
    error: string | null;

    // Actions
    loadProfile: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    resetProfile: () => void;

    // Convenience methods for specific fields
    setSkipUpdate: (skip: boolean, duration?: '7days' | '30days' | 'forever') => Promise<void>;
    setSimbriefUsername: (username: string) => Promise<void>;
    setCommunityFolderAirports: (airports: string[]) => Promise<void>;
    setIgnoredAirports: (ignoredAirports: string[]) => Promise<void>;
}

export const useUserProfileStore = create<UserProfileState>()(
    persist(
        (set, get) => ({
            // Initial state
            profile: null,
            isLoading: false,
            error: null,

            // Load profile from database
            loadProfile: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const profile = await getUserProfile();
                    set({ profile, isLoading: false });
                } catch (error) {
                    console.error("Failed to load user profile:", error);
                    set({
                        error: error instanceof Error ? error.message : "Failed to load profile",
                        isLoading: false
                    });
                }
            },

            // Update profile with partial data
            updateProfile: async (updates: Partial<UserProfile>) => {
                try {
                    set({ isLoading: true, error: null });

                    // Merge with existing profile data to avoid overwriting other fields
                    const currentProfile = get().profile || {};
                    const updatedData = { ...currentProfile, ...updates };

                    const result = await updateUserProfile(updatedData);
                    set({ profile: result, isLoading: false });
                } catch (error) {
                    console.error("Failed to update user profile:", error);
                    set({
                        error: error instanceof Error ? error.message : "Failed to update profile",
                        isLoading: false
                    });
                }
            },

            // Reset profile state
            resetProfile: () => {
                set({ profile: null, error: null });
            },

            // Set skip update with optional duration
            setSkipUpdate: async (skip: boolean, duration?: '7days' | '30days' | 'forever') => {
                let skipUpdateUntil: Date | null = null;

                if (skip && duration) {
                    skipUpdateUntil = new Date();

                    switch (duration) {
                        case '7days':
                            skipUpdateUntil.setDate(skipUpdateUntil.getDate() + 7);
                            break;
                        case '30days':
                            skipUpdateUntil.setDate(skipUpdateUntil.getDate() + 30);
                            break;
                        case 'forever':
                            // Set to a very far future date
                            skipUpdateUntil = new Date(8640000000000000);
                            break;
                    }
                }

                return get().updateProfile({ skipUpdate: skip, skipUpdateUntil });
            },

            setIgnoredAirports: async (ignoredAirports: string[]) => {
                return get().updateProfile({ ignoredAirports });
            },

            // Convenience method for setting SimBrief username
            setSimbriefUsername: async (username: string) => {
                return get().updateProfile({ simbriefUsername: username });
            },

            // Convenience method for setting community folder airports
            setCommunityFolderAirports: async (airports: string[]) => {
                return get().updateProfile({ communityFolderAirports: airports });
            }
        }),
        {
            name: "gsx-profile-manager-user-profile",
            // Only persist certain data, not status flags
            partialize: (state) => ({
                profile: state.profile,
            }),
        }
    )
);

// Auto-load profile on module import
useUserProfileStore.getState().loadProfile();