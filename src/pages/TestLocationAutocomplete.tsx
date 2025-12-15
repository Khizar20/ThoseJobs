import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GoogleMapsAutocomplete from "@/components/GoogleMapsAutocomplete";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { MapPin, CheckCircle } from "lucide-react";

const TestLocationAutocomplete = () => {
  const [location, setLocation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const handleLocationSelect = (locationData: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(locationData);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (selectedLocation) {
      setSelectedLocation(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Google Maps Autocomplete Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Location Input</h3>
                <p className="text-sm text-muted-foreground">
                  Start typing to see Google Maps autocomplete suggestions. Select a suggestion to get coordinates.
                </p>
                
                <GoogleMapsAutocomplete
                  value={location}
                  onChange={handleLocationChange}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Try typing: Islamabad, Rawalpindi, Karachi..."
                  label="Location"
                  required={true}
                />
              </div>

              {selectedLocation && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Location Selected!</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Address:</span> {selectedLocation.address}
                      </div>
                      <div>
                        <span className="font-medium">Coordinates:</span> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Features Tested</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Google Maps Places Autocomplete API integration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Debounced search (300ms delay)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Automatic coordinate extraction
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    CORS fallback with proxy
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Loading states and error handling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Responsive dropdown positioning
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Usage Instructions</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>1. Start typing a location name (e.g., "Islamabad", "Rawalpindi")</p>
                  <p>2. Wait for autocomplete suggestions to appear</p>
                  <p>3. Click on a suggestion to select it</p>
                  <p>4. The coordinates will be automatically extracted</p>
                  <p>5. You can also type manually and use the "Find Coordinates" button</p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => {
                    setLocation("");
                    setSelectedLocation(null);
                  }}
                  variant="outline"
                >
                  Reset Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TestLocationAutocomplete; 