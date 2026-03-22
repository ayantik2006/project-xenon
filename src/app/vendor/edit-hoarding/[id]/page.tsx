"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hoardingSchema, type HoardingInput } from "@/lib/validators/hoarding";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { getLocationFromPincode, isValidIndianPincode } from "@/lib/googleMaps";
import MapLocationPicker from "@/components/MapLocationPicker";
import {
  Building2,
  MapPin,
  IndianRupee,
  Ruler,
  Info,
  Image as ImageIcon,
  Loader2,
  X,
  CheckCircle,
} from "lucide-react";

export default function EditHoardingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<HoardingInput>({
    resolver: zodResolver(hoardingSchema),
    defaultValues: {
      lightingType: "Non-Lit",
      type: "Billboard",
      images: [],
    },
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();
        if (data.user.role !== "vendor") {
          router.push("/");
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error("Auth check failed", error);
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  // Fetch existing hoarding data
  useEffect(() => {
    if (!authChecked) return;

    const fetchHoarding = async () => {
      try {
        const res = await fetchWithAuth(`/api/hoardings/${id}`);

        if (!res.ok) {
          setError("Failed to load hoarding details");
          return;
        }

        const data = await res.json();
        const hoarding = data.hoarding;

        // Populate form with existing data
        reset({
          name: hoarding.name,
          description: hoarding.description || "",
          address: hoarding.location.address,
          city: hoarding.location.city,
          area: hoarding.location.area,
          state: hoarding.location.state,
          zipCode: hoarding.location.zipCode || "",
          latitude: hoarding.location.coordinates?.lat,
          longitude: hoarding.location.coordinates?.lng,
          width: hoarding.dimensions.width,
          height: hoarding.dimensions.height,
          type: hoarding.type,
          lightingType: hoarding.lightingType,
          pricePerMonth: hoarding.pricePerMonth,
          minimumBookingAmount: hoarding.minimumBookingAmount || 0,
          images: hoarding.images || [],
        });

        setImages(hoarding.images || []);
      } catch (err: any) {
        setError("Failed to load hoarding");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHoarding();
  }, [authChecked, id, reset]);

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        const newImages = [...images, data.url];
        setImages(newImages);
        setValue("images", newImages);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err: any) {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setValue("images", newImages);
  };

  const handlePincodeChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const pincode = e.target.value;
    setValue("zipCode", pincode, { shouldValidate: true, shouldDirty: true });

    if (isValidIndianPincode(pincode)) {
      setPincodeLoading(true);
      try {
        const locationData = await getLocationFromPincode(pincode);

        if (locationData.city) {
          setValue("city", locationData.city, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
        if (locationData.state) {
          setValue("state", locationData.state, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
        if (locationData.area) {
          setValue("area", locationData.area, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
        if (locationData.lat && locationData.lng) {
          setValue("latitude", locationData.lat, { shouldValidate: true });
          setValue("longitude", locationData.lng, { shouldValidate: true });
        }
      } catch (error) {
        console.error("Failed to fetch location from pincode:", error);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleMapLocationSelect = (location: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    area?: string;
    lat: number;
    lng: number;
  }) => {
    if (location.address) {
      setValue("address", location.address, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (location.city) {
      setValue("city", location.city, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (location.state) {
      setValue("state", location.state, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (location.zipCode) {
      setValue("zipCode", location.zipCode, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (location.area) {
      setValue("area", location.area, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    setValue("latitude", location.lat, { shouldValidate: true, shouldDirty: true });
    setValue("longitude", location.lng, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data: HoardingInput) => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetchWithAuth(`/api/hoardings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update hoarding");

      setSuccess("Hoarding Updated Successfully!");
      setTimeout(() => {
        router.push("/vendor/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Hoarding</h1>
          <p className="text-gray-500 mt-2">Update your hoarding details</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-2">
              <CheckCircle /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Basic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hoarding Title
                  </label>
                  <input
                    {...register("name")}
                    placeholder="e.g. Billboard at Birsha Chawk"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Describe visibility, traffic, etc."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Photos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                  >
                    <img src={img} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors relative">
                  {uploading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="mb-2" />
                      <span className="text-xs">Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Upload high-resolution images for better reach.
              </p>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Location
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="text-sm text-[#2563eb] hover:underline flex items-center gap-1"
                >
                  <MapPin size={16} />
                  {showMap ? "Hide Map" : "Pick on Map"}
                </button>
              </div>

              {showMap && (
                <MapLocationPicker onLocationSelect={handleMapLocationSelect} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      {...register("address")}
                      value={watch("address") || ""}
                      placeholder="Exact street address"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <div className="relative">
                    <input
                      name="zipCode"
                      value={watch("zipCode") || ""}
                      onChange={handlePincodeChange}
                      placeholder="Enter 6-digit pincode"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                    />
                    {pincodeLoading && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-[#2563eb]" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-fills city & state
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    {...register("city")}
                    value={watch("city") || ""}
                    placeholder="e.g. Mumbai"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area / Locality
                  </label>
                  <input
                    {...register("area")}
                    value={watch("area") || ""}
                    placeholder="e.g. Andheri West"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                  {errors.area && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.area.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    {...register("state")}
                    value={watch("state") || ""}
                    placeholder="State"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                  {errors.state && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.state.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Specs & Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Specifications & Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    {...register("type")}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  >
                    <option value="Billboard">Billboard</option>
                    <option value="Unipole">Unipole</option>
                    <option value="Gantry">Gantry</option>
                    <option value="Bus Shelter">Bus Shelter</option>
                    <option value="Kiosk">Kiosk</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lighting
                  </label>
                  <select
                    {...register("lightingType")}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  >
                    <option value="Non-Lit">Non-Lit</option>
                    <option value="Lit">Lit</option>
                    <option value="Front Lit">Front Lit</option>
                    <option value="Back Lit">Back Lit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensions (Feet)
                  </label>
                  <div className="flex gap-2">
                    <input
                      {...register("width", { valueAsNumber: true })}
                      type="number"
                      placeholder="Width"
                      className="w-1/2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                    />
                    <span className="self-center text-gray-400">x</span>
                    <input
                      {...register("height", { valueAsNumber: true })}
                      type="number"
                      placeholder="Height"
                      className="w-1/2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                    />
                  </div>
                  {(errors.width || errors.height) && (
                    <p className="text-xs text-red-500 mt-1">
                      Both dimensions required
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Price (Base)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      {...register("pricePerMonth", { valueAsNumber: true })}
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                    />
                  </div>
                  {errors.pricePerMonth && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.pricePerMonth.message}
                    </p>
                  )}
                </div>

                {/* Minimum Booking Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Booking Amount
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      {...register("minimumBookingAmount", {
                        valueAsNumber: true,
                      })}
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank if same as monthly price
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/vendor/dashboard")}
                className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#2563eb] text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Hoarding"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
