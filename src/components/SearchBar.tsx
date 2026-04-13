"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation } from "lucide-react";
import { HOARDING_TYPES } from "@/utils/cities";
import { useRouter } from "next/navigation";

const B3_CITIES = [
  { city: "Bhubaneswar", state: "Odisha", display: "Bhubaneswar, Odisha" },
  { city: "Cuttack", state: "Odisha", display: "Cuttack, Odisha" },
  { city: "Rourkela", state: "Odisha", display: "Rourkela, Odisha" }
];

export default function SearchBar() {
  const router = useRouter();
  const [cityInput, setCityInput] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState(B3_CITIES);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter cities based on input
  useEffect(() => {
    if (cityInput.trim() === "") {
      setFilteredCities(B3_CITIES);
    } else {
      const filtered = B3_CITIES.filter(
        (cityObj) =>
          cityObj.city.toLowerCase().includes(cityInput.toLowerCase()) ||
          cityObj.state.toLowerCase().includes(cityInput.toLowerCase()) ||
          cityObj.display.toLowerCase().includes(cityInput.toLowerCase()),
      );
      setFilteredCities(filtered);
    }
  }, [cityInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (cityObj: (typeof B3_CITIES)[0]) => {
    setSelectedCity(cityObj.city);
    setCityInput(cityObj.display);
    setShowSuggestions(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Call geocoding API to get city name
          const res = await fetch(
            `/api/geocode?type=coordinates&lat=${latitude}&lng=${longitude}`,
          );

          if (!res.ok) {
            console.error("Geocode API error:", res.status, res.statusText);
            alert("Failed to get location details. Please try again.");
            setIsGettingLocation(false);
            return;
          }

          const data = await res.json();

          console.log("Geocode response:", data); // Debug log

          // Try to get city, area, or state as fallback
          const locationName = data.city || data.area || data.state;

          console.log("Detected location:", locationName); // Debug log

          if (locationName) {
            // Find matching city in our list
            const cityObj = B3_CITIES.find(
              (c) =>
                c.city.toLowerCase() === locationName.toLowerCase() ||
                c.display.toLowerCase().includes(locationName.toLowerCase()),
            );

            console.log("Matched city object:", cityObj); // Debug log

            if (cityObj) {
              handleCitySelect(cityObj);
              console.log("Set city from list:", cityObj.display); // Debug log
            } else {
              // If not in our predefined list, just use the location name
              setSelectedCity(locationName);
              setCityInput(locationName);
              console.log("Set city directly:", locationName); // Debug log
            }
          } else {
            alert(
              "Could not determine city from your location. Please select manually.",
            );
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          alert("Failed to get location details. Please try again.");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to get your location. Please enable location access.");
        setIsGettingLocation(false);
      },
    );
  };

  const handleSearch = () => {
    // Build query params
    const params = new URLSearchParams();
    if (selectedCity) params.append("city", selectedCity);
    if (selectedType) params.append("type", selectedType);

    // Navigate to explore page
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-none shadow-[6px_6px_0px_0px_rgba(30,41,59,0.5)] border border-blue-200 p-6 md:p-10 relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 relative z-10">
        {/* City Input with Autocomplete */}
        <div className="md:col-span-5 relative" ref={suggestionsRef}>
          <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
            City
          </label>
          <div className="relative">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search by city"
              className="w-full px-4 py-3 pl-11 border border-blue-200 focus:ring-0 focus:border-blue-400 bg-transparent outline-none transition-colors text-sm font-bold tracking-wide text-slate-900 placeholder:font-medium placeholder:text-slate-400"
            />
            <MapPin
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#2563eb] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Use current location"
            >
              <Navigation
                size={18}
                className={isGettingLocation ? "animate-pulse" : ""}
              />
            </button>
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && filteredCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-none shadow-2xl shadow-blue-900/10 max-h-48 overflow-y-auto overscroll-contain z-50 outline-none divide-y divide-slate-100">
              {filteredCities.slice(0, 10).map((cityObj, index) => (
                <button
                  key={index}
                  onClick={() => handleCitySelect(cityObj)}
                  className="w-full px-4 py-4 text-left hover:bg-slate-50 hover:pl-6 transition-all duration-300 flex items-center gap-4 group"
                >
                  <MapPin size={14} className="text-slate-400 group-hover:text-[#2563eb] transition-colors shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-[#2563eb] transition-colors">
                    {cityObj.display}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hoarding Type Dropdown */}
        <div className="md:col-span-4">
          <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
            Hoarding Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-3 border border-blue-200 focus:ring-0 focus:border-blue-400 bg-transparent outline-none transition-colors text-sm font-bold tracking-wide text-slate-900 appearance-none cursor-pointer"
          >
            <option value="" className="text-xs uppercase tracking-wider font-bold">ALL TYPES</option>
            {HOARDING_TYPES.map((type) => (
              <option key={type} value={type} className="text-xs uppercase tracking-wider font-bold">
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 flex items-end">
          <button
            onClick={handleSearch}
            className="group w-full bg-slate-900 hover:bg-[#2563eb] text-white font-black text-[11px] uppercase tracking-[0.15em] py-4 px-6 rounded-none transition-all flex items-center justify-center shadow-xl hover:-translate-y-1 overflow-hidden"
          >
            <div className="w-0 opacity-0 overflow-hidden transition-all duration-300 ease-out group-hover:w-5 group-hover:opacity-100 group-hover:mr-2 flex items-center justify-center">
              <Search size={16} className="shrink-0" />
            </div>
            <span className="transition-transform duration-300">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
