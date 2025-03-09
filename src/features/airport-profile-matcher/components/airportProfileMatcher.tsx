import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProfileStore } from '@/store/useGsxProfileStore';
import { toast } from 'sonner';
import { CheckCircle, XCircle, RefreshCcw, Download, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { open } from '@tauri-apps/plugin-shell';

interface AirportInfo {
    icao: string;
    title: string;
    path: string;
}

interface AirportMatchStatus extends AirportInfo {
    hasProfile: boolean;
    isIgnored: boolean;  // New field to track ignored status
}

export default function AirportProfileMatcher({ onClose }: { onClose: () => void }) {
    const [airports, setAirports] = useState<AirportMatchStatus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { profiles } = useProfileStore();
    const { setCommunityFolderAirports, setIgnoredAirports } = useUserProfileStore();
    const { profile: userProfile } = useUserProfileStore();
    const [selectedTab, setSelectedTab] = useState<'all' | 'matched' | 'unmatched' | 'ignored'>('all');

    const ignoredAirports = userProfile?.ignoredAirports || [];

    useEffect(() => {
        scanAirports();
    }, []);

    const scanAirports = async () => {
        try {
            setIsLoading(true);
            const airportResults = await invoke<AirportInfo[]>('scan_for_airport_scenery');

            // Match airports with profiles and mark ignored
            const matchedAirports = airportResults.map(airport => {
                const hasProfile = profiles.some(profile => {
                    // Use direct comparison with airportIcaoCode
                    return profile.airportIcaoCode?.toUpperCase() === airport.icao;
                });

                const isIgnored = ignoredAirports.includes(airport.icao);

                return {
                    ...airport,
                    hasProfile,
                    isIgnored
                };
            });

            // Sort by matched first, then non-ignored, then by ICAO code
            matchedAirports.sort((a, b) => {
                if (a.hasProfile !== b.hasProfile) {
                    return a.hasProfile ? -1 : 1;
                }
                if (a.isIgnored !== b.isIgnored) {
                    return a.isIgnored ? 1 : -1;
                }
                return a.icao.localeCompare(b.icao);
            });

            setAirports(matchedAirports);

            // Save the airport list to user profile
            await setCommunityFolderAirports(matchedAirports.map(airport => airport.icao));

        } catch (error) {
            toast.error(`Failed to scan for airports: ${error}`);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindProfile = async (icaoCode: string) => {
        try {
            // Open the flightsim.to search URL for this airport's GSX profiles
            await open(`https://flightsim.to/others/gsx-pro/search/${icaoCode}`);
        } catch (error) {
            toast.error("Failed to open browser");
            console.error("Failed to open URL:", error);
        }
    };

    const handleIgnoreProfile = async (icaoCode: string) => {
        try {
            // Add to ignored list
            const updatedIgnoredList = [...ignoredAirports, icaoCode];
            await setIgnoredAirports(updatedIgnoredList);

            // Update local state
            setAirports(currentAirports =>
                currentAirports.map(airport =>
                    airport.icao === icaoCode
                        ? { ...airport, isIgnored: true }
                        : airport
                )
            );

            toast.success(`${icaoCode} added to ignored airports`);
        } catch (error) {
            toast.error("Failed to ignore airport");
            console.error("Failed to ignore airport:", error);
        }
    };

    const handleUnignoreProfile = async (icaoCode: string) => {
        try {
            // Remove from ignored list
            const updatedIgnoredList = ignoredAirports.filter(code => code !== icaoCode);
            await setIgnoredAirports(updatedIgnoredList);

            // Update local state
            setAirports(currentAirports =>
                currentAirports.map(airport =>
                    airport.icao === icaoCode
                        ? { ...airport, isIgnored: false }
                        : airport
                )
            );

            toast.success(`${icaoCode} removed from ignored airports`);
        } catch (error) {
            toast.error("Failed to unignore airport");
            console.error("Failed to unignore airport:", error);
        }
    };

    const filteredAirports = airports.filter(airport => {
        if (selectedTab === 'matched') return airport.hasProfile;
        if (selectedTab === 'unmatched') return !airport.hasProfile && !airport.isIgnored;
        if (selectedTab === 'ignored') return airport.isIgnored;
        return true;
    });

    const matchedCount = airports.filter(a => a.hasProfile).length;
    const unmatchedCount = airports.filter(a => !a.hasProfile && !a.isIgnored).length;
    const ignoredCount = airports.filter(a => a.isIgnored).length;

    return (
        <div className="space-y-4">
            {/* Header with title and rescan button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Airport Profile Matcher</h2>
                    <p className="text-sm text-muted-foreground">Check your community airports against your stored GSX profiles</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={scanAirports}
                    disabled={isLoading}
                    className="flex items-center gap-1"
                >
                    <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Rescan
                </Button>
            </div>

            {/* Tab navigation */}
            <div className="flex space-x-1 rounded-lg bg-muted p-1">
                <Button
                    variant={selectedTab === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTab('all')}
                    className="flex-1"
                >
                    All ({airports.length})
                </Button>
                <Button
                    variant={selectedTab === 'matched' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTab('matched')}
                    className="flex-1"
                >
                    Matched ({matchedCount})
                </Button>
                <Button
                    variant={selectedTab === 'unmatched' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTab('unmatched')}
                    className="flex-1"
                >
                    Missing ({unmatchedCount})
                </Button>
                <Button
                    variant={selectedTab === 'ignored' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTab('ignored')}
                    className="flex-1"
                >
                    Ignored ({ignoredCount})
                </Button>
            </div>

            {/* Main content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2">Scanning airports...</span>
                </div>
            ) : (
                <ScrollArea className="h-[400px] pr-4">
                    <ul className="space-y-2">
                        {filteredAirports.map((airport) => (
                            <li
                                key={airport.icao}
                                className={`flex items-center justify-between p-3 rounded-md border ${airport.isIgnored ? 'bg-gray-50 border-gray-200' :
                                        airport.hasProfile ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                    }`}
                            >
                                <div>
                                    <div className="font-semibold flex items-center">
                                        {airport.isIgnored ? (
                                            <EyeOff className="h-5 w-5 text-gray-500 mr-2" />
                                        ) : airport.hasProfile ? (
                                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 mr-2" />
                                        )}
                                        {airport.icao}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{airport.title}</div>
                                </div>

                                <div className="flex space-x-2">
                                    {!airport.hasProfile && !airport.isIgnored && (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => handleIgnoreProfile(airport.icao)}>
                                                <EyeOff className="h-4 w-4 mr-1" />
                                                Ignore
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleFindProfile(airport.icao)}>
                                                <Download className="h-4 w-4 mr-1" />
                                                Find Profile
                                            </Button>
                                        </>
                                    )}

                                    {airport.isIgnored && (
                                        <Button size="sm" variant="outline" onClick={() => handleUnignoreProfile(airport.icao)}>
                                            Unignore
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}

                        {filteredAirports.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No airports found in this category
                            </div>
                        )}
                    </ul>
                </ScrollArea>
            )}

            <div className="flex justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                    Found {airports.length} airports in your community folder.
                    <br />
                    {matchedCount} have profiles, {unmatchedCount} need profiles, {ignoredCount} ignored.
                </div>
                <Button onClick={onClose}>Close</Button>
            </div>
        </div>
    );
}