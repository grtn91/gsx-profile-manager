import { useState, useEffect, useCallback } from "react";
import { useUserProfileStore } from "@/store/useUserProfileStore";
import { useProfileStore } from "@/store/useGsxProfileStore";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { AirportCard } from "./AirportCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Map, Plane, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

interface SimBriefData {
    origin: {
        icao_code: string;
        name: string;
    };
    destination: {
        icao_code: string;
        name: string;
    };
    alternate?: {
        icao_code: string;
        name: string;
    };
    general: {
        icao_airline: string;
        flight_number: string;
        route_distance: string;
    };
    aircraft: {
        icaocode: string;
        name: string;
    };
    times: {
        est_time_enroute: string;
    };
    [key: string]: any; // To allow for other properties
}

interface SimBriefRouteProps {
    onClose: () => void;
}

const NearbyAirportSchema = z.object({
    icao: z.string(),
    name: z.string(),
    distance: z.string(),
    waypoint: z.string(),
});

const NearbyAirportsResponseSchema = z.object({
    airports: z.array(NearbyAirportSchema)
});


export default function SimBriefRoute({ onClose }: SimBriefRouteProps) {
    const { profile, updateOpenAiApiKey } = useUserProfileStore();
    const { profiles } = useProfileStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [simbriefData, setSimbriefData] = useState<SimBriefData | null>(null);
    const [nearbyAirports, setNearbyAirports] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);
    const [openAIKey, setOpenAIKey] = useState<string>("");
    const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

    // Load the OpenAI API key from user profile
    useEffect(() => {
        if (profile?.openaiApiKey) {
            setOpenAIKey(profile.openaiApiKey);
        }
    }, [profile]);



    const NearbyAirportsSection = () => {
        if (showApiKeyInput) {
            return <ApiKeyInputSection />;
        }

        if (isAnalyzing) {
            return (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span>Analyzing flight route for nearby airports...</span>
                    <p className="text-xs text-gray-500">This may take a moment</p>
                </div>
            );
        }

        if (analyzeError) {
            return (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <p>{analyzeError}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => analyzeRouteForNearbyAirports()}
                    >
                        Try Again
                    </Button>
                </div>
            );
        }

        if (nearbyAirports.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Map className="h-12 w-12 text-gray-400" />
                    <div className="text-center">
                        <h3 className="font-medium text-gray-900">No nearby airports analyzed yet</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Click the button below to find airports near your route waypoints.
                        </p>
                    </div>
                    <Button
                        className="mt-2"
                        onClick={analyzeRouteForNearbyAirports}
                        disabled={!simbriefData?.navlog?.fix}
                    >
                        <Map className="h-4 w-4 mr-2" />
                        Analyze Route
                    </Button>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Nearby Airports</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={analyzeRouteForNearbyAirports}
                        className="text-xs"
                    >
                        <Plane className="h-3 w-3 mr-1" />
                        Refresh
                    </Button>
                </div>

                <ScrollArea className="h-[200px] rounded border p-4">
                    <div className="space-y-3">
                        {nearbyAirports.map((airport, index) => {
                            const profileStatus = getProfileStatus(airport.icao);

                            return (
                                <div key={index} className="flex justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <div className="flex items-center">
                                            <Badge variant="outline" className="mr-2">{airport.icao}</Badge>
                                            <span className="text-sm font-medium">{airport.name}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            <span>Near {airport.waypoint}</span>
                                            <span className="mx-1">•</span>
                                            <span>{airport.distance}</span>
                                        </div>
                                    </div>
                                    <div>
                                        {profileStatus.installed ? (
                                            <Badge variant="success" className="text-xs">Profile Available</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs">No Profile</Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>
        );
    };

    // API key input section component
    const ApiKeyInputSection = () => (
        <div className="space-y-4 p-4 border rounded-md">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">OpenAI API Key Required</h3>
                    <p className="text-sm text-gray-500">
                        Enter your API key to analyze nearby airports
                    </p>
                </div>
                <Settings className="h-5 w-5 text-gray-400" />
            </div>

            <Input
                type="password"
                placeholder="sk-..."
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                className="font-mono"
            />

            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => setShowApiKeyInput(false)}
                >
                    Cancel
                </Button>
                <Button
                    onClick={async () => {
                        // Save the API key to user profile
                        if (openAIKey && openAIKey.trim().length > 10) {
                            try {
                                await updateOpenAiApiKey(openAIKey);
                                console.log("OpenAI API key saved to user profile");
                            } catch (err) {
                                console.error("Failed to save OpenAI API key:", err);
                            }
                        }

                        setShowApiKeyInput(false);
                        analyzeRouteForNearbyAirports();
                    }}
                    disabled={!openAIKey || openAIKey.trim().length < 10}
                >
                    Save & Analyze
                </Button>
            </div>

            <p className="text-xs text-gray-500">
                Your API key is only stored locally and never sent to our servers.
            </p>
        </div>
    );


    // Route analysis function - modified to handle API key from profile
    const analyzeRouteForNearbyAirports = useCallback(async () => {
        if (!simbriefData || !simbriefData.navlog?.fix) {
            setAnalyzeError("No flight plan data available to analyze.");
            return;
        }

        // Check if API key exists in state (loaded from profile or user input)
        if (!openAIKey) {
            setShowApiKeyInput(true);
            return;
        }

        setIsAnalyzing(true);
        setAnalyzeError(null);

        try {
            // Extract waypoints and other logic remains the same
            const waypoints = simbriefData.navlog.fix
                .filter((wp: any) => wp.ident && wp.ident.trim() !== '')
                .map((wp: any) => ({
                    ident: wp.ident,
                    lat: wp.pos_lat,
                    lon: wp.pos_long
                }));

            if (waypoints.length === 0) {
                setAnalyzeError("No valid waypoints found in the flight plan.");
                setIsAnalyzing(false);
                return;
            }

            // Initialize OpenAI client with the key from state
            const openai = new OpenAI({
                apiKey: openAIKey,
                dangerouslyAllowBrowser: true
            });

            // Rest of the API call logic remains the same...
            const completion = await openai.beta.chat.completions.parse({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are an assistant that finds airports near flight plan waypoints."
                    },
                    {
                        role: "user",
                        content: `Find airports within a 40nm radius of these waypoints from my flight plan:
                        ${JSON.stringify(waypoints)}
                        
                        For each waypoint, list only 2-3 of the most significant airports within 40nm.
                        Include ICAO code, airport name, approximate distance, and the waypoint it's near.
                        If no airports are within 40nm of a waypoint, don't include that waypoint.
                        Skip airports that are the origin, destination, or alternate in my flight plan.
                        
                        Return results as a list of airports under an "airports" property.`
                    }
                ],
                response_format: zodResponseFormat(NearbyAirportsResponseSchema, "response"),
            });

            // Process the results
            const airports = completion.choices[0].message.parsed?.airports;

            // Filter airports and set state
            const flightAirports = [
                simbriefData.origin?.icao_code,
                simbriefData.destination?.icao_code,
                simbriefData.alternate?.icao_code
            ].filter(Boolean).map(code => code?.toUpperCase());

            const filteredAirports = airports!.filter(
                airport => !flightAirports.includes(airport.icao.toUpperCase())
            );

            setNearbyAirports(filteredAirports);

        } catch (err) {
            console.error("Failed to analyze route:", err);
            // Handle error cases
            if (err instanceof OpenAI.APIError) {
                // If API key is invalid, prompt for a new one
                if (err.status === 401) {
                    setAnalyzeError("Invalid or expired API key. Please enter a valid OpenAI API key.");
                    setShowApiKeyInput(true);
                } else {
                    setAnalyzeError(`OpenAI API error: ${err.status} - ${err.message}`);
                }
            } else if (err instanceof z.ZodError) {
                setAnalyzeError("The API response didn't match the expected format");
            } else {
                setAnalyzeError(err instanceof Error ? err.message : String(err));
            }
        } finally {
            setIsAnalyzing(false);
        }
    }, [simbriefData, openAIKey, updateOpenAiApiKey]);


    // Function to check if a profile exists and is activated for an ICAO code
    const getProfileStatus = (icao: string | undefined) => {
        if (!icao) return { installed: false, activated: false };

        const matchingProfiles = profiles.filter(
            profile => profile.airportIcaoCode.toUpperCase() === icao.toUpperCase()
        );

        const isInstalled = matchingProfiles.length > 0;
        const isActivated = matchingProfiles.some(profile =>
            profile.status === true || profile.applied === true
        );

        return {
            installed: isInstalled,
            activated: isActivated
        };
    };

    useEffect(() => {
        const fetchSimbriefData = async () => {
            if (!profile?.simbriefUsername) {
                setError("No Simbrief username found. Please set your username in User Settings.");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const username = profile.simbriefUsername;
                console.log(`Fetching Simbrief data for username: ${username}`);

                const response = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?username=${username}&json=1`);

                if (!response.ok) {
                    throw new Error(`API returned ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log("Simbrief API Response:", data);
                setSimbriefData(data);
            } catch (err) {
                console.error("Failed to fetch Simbrief data:", err);
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setIsLoading(false);
            }
        };

        fetchSimbriefData();
    }, [profile?.simbriefUsername]);

    const calcHoursFromMinutesStr = (timeStr: string) => {
        const time = parseInt(timeStr, 10);
        return Math.floor(time / 60 / 60) + (time % 60 ? `:${String(time % 60).padStart(2, '0')}` : '');
    };

    return (
        <div className="space-y-4">
            {isLoading && (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading Simbrief data...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && !error && simbriefData && (
                <>
                    {/* Flight Information Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Flight</h3>
                        <p className="text-lg font-bold">
                            {simbriefData.general.icao_airline || ''}{simbriefData.general.flight_number || ''}
                            {' · '}
                            {simbriefData.aircraft?.name || 'Unknown Aircraft'}
                        </p>
                        <div className="text-sm text-gray-500 mt-1">
                            {(calcHoursFromMinutesStr(simbriefData.times?.est_time_enroute)) || '0'}h

                            {' · '}
                            {simbriefData.general?.route_distance || '0'} NM
                        </div>
                    </div>

                    <Tabs defaultValue="airports">
                        <TabsList className="grid grid-cols-2 mb-4">
                            <TabsTrigger value="airports">Flight Airports</TabsTrigger>
                            <TabsTrigger value="nearby">Nearby Airports</TabsTrigger>
                        </TabsList>

                        <TabsContent value="airports">
                            {/* Airport cards in 3-column layout remains the same */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <AirportCard
                                    type="origin"
                                    icao={simbriefData.origin?.icao_code}
                                    name={simbriefData.origin?.name}
                                    profiles={getProfileStatus(simbriefData.origin?.icao_code)}
                                />

                                <AirportCard
                                    type="destination"
                                    icao={simbriefData.destination?.icao_code}
                                    name={simbriefData.destination?.name}
                                    profiles={getProfileStatus(simbriefData.destination?.icao_code)}
                                />

                                <AirportCard
                                    type="alternate"
                                    icao={simbriefData.alternate?.icao_code}
                                    name={simbriefData.alternate?.name}
                                    profiles={getProfileStatus(simbriefData.alternate?.icao_code)}
                                />
                            </div>

                            {/* Warning message remains the same */}
                        </TabsContent>

                        <TabsContent value="nearby">
                            <NearbyAirportsSection />
                        </TabsContent>
                    </Tabs>


                    {/* Missing profiles warning if needed */}
                    {!getProfileStatus(simbriefData.origin?.icao_code).installed ||
                        !getProfileStatus(simbriefData.destination?.icao_code).installed && (
                            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded mt-4">
                                <AlertCircle className="h-5 w-5" />
                                <p className="text-sm">
                                    Some airports in your flight plan are missing GSX profiles. Consider adding them before flying.
                                </p>
                            </div>
                        )}
                </>
            )}

            <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={onClose} className="mr-2">
                    Close
                </Button>
            </div>
        </div>
    );
}