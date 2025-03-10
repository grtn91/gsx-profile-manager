import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

interface AirportCardProps {
    type: string;
    icao: string | undefined;
    name: string | undefined;
    profiles: {
        installed: boolean;
        activated: boolean;
    };
}

// Airport Card Component
export function AirportCard({ type, icao, name, profiles }: AirportCardProps) {
    const title = type.charAt(0).toUpperCase() + type.slice(1);

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <span>{title}</span>
                    <Badge variant={icao ? "default" : "outline"}>{icao || "N/A"}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-sm font-medium">{name || "Not specified"}</p>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">GSX Profile:</span>
                        {profiles.installed ? (
                            <Badge variant="success" className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Installed
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                                <X className="h-3 w-3" />
                                Not Installed
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Activated:</span>
                        {profiles.activated ? (
                            <Badge variant="success" className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Active
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                                <X className="h-3 w-3" />
                                Not Active
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}