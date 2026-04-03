"use client";

import { useState, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { getAddressFromCoordinates } from "@/lib/googleMaps";
import { MapPin, Loader2 } from "lucide-react";

interface MapLocationPickerProps {
  onLocationSelect: (location: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    area?: string;
    lat: number;
    lng: number;
  }) => void;
  initialCenter?: { lat: number; lng: number };
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "12px",
};

// Default center - India
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

export default function MapLocationPicker({
  onLocationSelect,
  initialCenter,
}: MapLocationPickerProps) {
  const browserMapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";

  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(initialCenter || null);
  const [mapCenter, setMapCenter] = useState(initialCenter || defaultCenter);
  const [loading, setLoading] = useState(false);
  const [mapsLoadFailed, setMapsLoadFailed] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: browserMapsApiKey,
  });

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setMarkerPosition({ lat, lng });
      setLoading(true);

      try {
        // Get address details from coordinates
        const locationDetails = await getAddressFromCoordinates(lat, lng);

        onLocationSelect({
          ...locationDetails,
          lat,
          lng,
        });
      } catch (error) {
        console.error("Failed to get location details:", error);
      } finally {
        setLoading(false);
      }
    },
    [onLocationSelect],
  );

  // Get user's current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });

        try {
          const locationDetails = await getAddressFromCoordinates(lat, lng);
          onLocationSelect({
            ...locationDetails,
            lat,
            lng,
          });
        } catch (error) {
          console.error("Failed to get location details:", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(
          "Failed to get your location. Please click on the map to select location.",
        );
        setLoading(false);
      },
    );
  };

  if (!browserMapsApiKey || mapsLoadFailed || loadError) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MapPin className="mx-auto mb-2" size={32} />
          <p>Google Maps is unavailable</p>
          <p className="text-xs mt-1">
            {mapsLoadFailed || loadError
              ? "Failed to load Google Maps script."
              : "Add a valid `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable map pinning."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <MapPin className="inline mr-1" size={16} />
          Click on the map to pin your hoarding location
        </p>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={loading}
          className="text-sm text-[#2563eb] hover:underline disabled:opacity-50"
        >
          {loading ? "Getting location..." : "Use Current Location"}
        </button>
      </div>

      <div className="relative">
        {!isLoaded ? (
          <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
            <Loader2 className="animate-spin text-[#2563eb]" size={32} />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={markerPosition ? 15 : 5}
            center={mapCenter}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {markerPosition && (
              <Marker
                position={markerPosition}
                animation={google.maps.Animation.DROP}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {markerPosition && (
        <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          ✓ Location selected: {markerPosition.lat.toFixed(6)},{" "}
          {markerPosition.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
