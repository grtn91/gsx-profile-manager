import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GSXProfile } from '@/types/gsx-profile';
import { initializeDb, addProfile, updateProfile, deleteProfile, updateProfileStatus, getAllProfiles, closeDb } from '@/lib/db';
import { deleteProfileFiles } from '@/lib/fileSystem';

interface ProfileState {
    profiles: GSXProfile[];
    isLoading: boolean;
    error: string | null;

    // Actions
    initializeStore: () => Promise<void>;
    addProfile: (profileData: GSXProfile) => Promise<GSXProfile>;
    removeProfile: (id: string) => Promise<void>;
    syncProfile: (id: string) => Promise<void>;
    unsyncProfile: (id: string) => Promise<void>;
    updateProfile: (id: string, data: Partial<GSXProfile>) => Promise<void>;
    getProfileById: (id: string) => GSXProfile | undefined;
    getSyncedProfiles: () => GSXProfile[];
    getAllProfiles: () => Promise<void>;
    getAllAirportIcaoCodes: () => string[];
    getAllAirportDevelopers: () => string[];
    getAllCountries: () => string[];
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set, get) => ({
            profiles: [],
            isLoading: false,
            error: null,

            initializeStore: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Initialize SQLite database
                    await initializeDb();

                    // Load profiles from database
                    const dbProfiles = await getAllProfiles();

                    // Update store with profiles from database
                    set({
                        profiles: dbProfiles,
                        isLoading: false
                    });

                    console.log('Store initialized with database data');
                } catch (error) {
                    console.error('Failed to initialize store from database:', error);
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to initialize store from database'
                    });
                }
            },

            addProfile: async (profileData: GSXProfile) => {
                set({ isLoading: true, error: null });
                try {
                    // Add profile to database first
                    const savedProfile = await addProfile(profileData).then((profile) => {
                        console.log('Profile saved to database:', profile);
                        return profile;
                    });

                    // Then update the store
                    set(state => ({
                        profiles: [...state.profiles, savedProfile],
                        isLoading: false
                    }));
                    return savedProfile;
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to add profile'
                    });
                    throw error;
                }
            },

            removeProfile: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    // First delete from database
                    await deleteProfile(id);

                    // Then delete physical files if needed
                    deleteProfileFiles(id);

                    // Then update the store
                    set(state => ({
                        profiles: state.profiles.filter(profile => profile.id !== id),
                        isLoading: false
                    }));
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to remove profile'
                    });
                    throw error;
                }
            },

            // Update other methods with db operations too
            syncProfile: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    await updateProfileStatus(id, true);
                    set(state => ({
                        profiles: state.profiles.map(profile =>
                            profile.id === id ? { ...profile, status: true } : profile
                        ),
                        isLoading: false
                    }));
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to sync profile'
                    });
                    throw error;
                }
            },

            unsyncProfile: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    await updateProfileStatus(id, false);
                    set(state => ({
                        profiles: state.profiles.map(profile =>
                            profile.id === id ? { ...profile, status: false } : profile
                        ),
                        isLoading: false
                    }));
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to unsync profile'
                    });
                    throw error;
                }
            },

            updateProfile: async (id: string, data: Partial<GSXProfile>) => {
                set({ isLoading: true, error: null });
                try {
                    await updateProfile(id, data);
                    set(state => ({
                        profiles: state.profiles.map(profile =>
                            profile.id === id ? { ...profile, ...data } : profile
                        ),
                        isLoading: false
                    }));
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to update profile'
                    });
                    throw error;
                }
            },

            getProfileById: (id: string) => {
                return get().profiles.find(profile => profile.id === id);
            },

            getAllProfiles: async () => {
                set({ isLoading: true, error: null });
                try {
                    const dbProfiles = await getAllProfiles();
                    set({
                        profiles: dbProfiles,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to fetch profiles'
                    });
                }
            },

            // Add this new function inside the store definition
            getSyncedProfiles: () => {
                const { profiles } = get();
                return profiles.filter(profile => profile.status === true);
            },

            getAllAirportIcaoCodes: () => {
                const { profiles } = get();
                return [...new Set(profiles.map(profile => profile.airportIcaoCode))];
            },

            getAllAirportDevelopers: () => {
                const { profiles } = get();
                return [...new Set(profiles.map(profile => profile.airportDeveloper).filter((dev): dev is string => dev !== undefined))];
            },

            getAllCountries: () => {
                const { profiles } = get();
                return [...new Set(profiles.map(profile => profile.country).filter((country): country is string => country !== undefined))];
            }
        }),
        {
            name: 'gsx-profile-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                profiles: state.profiles
            }),
            // This ensures the db is initialized when the store is hydrated
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Initialize the database after hydration
                    state.initializeStore();
                }
            }
        }
    )
);

// Clean up resources on app exit
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        closeDb().catch(console.error);
    });
}