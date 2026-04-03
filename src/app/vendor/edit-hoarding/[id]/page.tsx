"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hoardingSchema, type HoardingInput } from "@/lib/validators/hoarding";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { getLocationFromPincode, isValidIndianPincode } from "@/lib/googleMaps";
import MapLocationPicker from "@/components/MapLocationPicker";
import "@fontsource/chiron-goround-tc";
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
  ArrowLeft,
  Camera,
  Layers,
  Zap,
  Globe,
  Plus,
  Trash2,
  LayoutDashboard,
  Save,
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
    resolver: zodResolver(hoardingSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      area: "",
      state: "",
      zipCode: "",
      latitude: 0,
      longitude: 0,
      width: 0,
      height: 0,
      pricePerMonth: 0,
      lightingType: "Non-Lit",
      type: "Billboard",
      images: [],
      hoardingCode: "",
      trafficFrom: "",
      uniqueReach: 0,
      uniqueFootfall: 0,
      minimumBookingMonths: 1,
      minimumBookingAmount: 0,
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
          minimumBookingMonths: hoarding.minimumBookingMonths || 1,
          hoardingCode: hoarding.hoardingCode || "",
          trafficFrom: hoarding.trafficFrom || "",
          uniqueReach: hoarding.uniqueReach || 0,
          uniqueFootfall: hoarding.uniqueFootfall || 0,
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

  const onSubmit = async (data: any) => {
    const validatedData = data as HoardingInput;
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (!validatedData.pricePerMonth || validatedData.pricePerMonth < 1) {
        throw new Error("Price per month is required.");
      }

      if (
        typeof validatedData.latitude !== "number" ||
        typeof validatedData.longitude !== "number" ||
        Number.isNaN(validatedData.latitude) ||
        Number.isNaN(validatedData.longitude)
      ) {
        setShowMap(true);
        throw new Error("Please pin the hoarding on the map before updating.");
      }

      const res = await fetchWithAuth(`/api/hoardings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8" style={{ fontFamily: "'Chiron GoRound TC', sans-serif" }}>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
          <div className="space-y-1">
            <Link 
              href="/vendor/dashboard" 
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-xl mb-4 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Edit <span className="text-blue-600">Hoarding</span>
            </h1>
            <p className="text-gray-500 font-medium">Update your property details to maximize listing visibility.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <Link
                href="/vendor/dashboard"
                className="px-8 py-4 bg-white text-orange-600 rounded-[1.5rem] font-black text-sm hover:bg-orange-600 hover:text-white transition-all border-2 border-orange-100 shadow-sm flex items-center justify-center min-w-[140px]"
              >
                Discard
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 group disabled:opacity-50 min-w-[180px]"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                    Save Changes
                  </>
                )}
              </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] font-bold text-sm animate-in zoom-in duration-300 shadow-sm flex items-center gap-2">
            <X size={18} className="shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-[2rem] font-bold text-sm animate-in slide-in-from-top-4 duration-300 shadow-sm flex items-center gap-2">
            <CheckCircle size={18} className="shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit as any)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Sections */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Basic Info Card */}
            <section className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-blue-900/5 rounded-[2.5rem] p-8 md:p-10 space-y-8 transition-all hover:shadow-blue-900/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Basic Information</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identify your media asset</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Property Title</label>
                  <input
                    {...register("name")}
                    placeholder="e.g. Billboard at Birsha Chawk"
                    className={`w-full px-5 py-4 bg-gray-50/50 border-2 ${errors.name ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:border-blue-600'} rounded-2xl outline-none font-bold text-gray-700 transition-all focus:bg-white`}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-red-500 font-black uppercase px-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description</label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    placeholder="Describe visibility, daily traffic, and surrounding landmarks..."
                    className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-gray-700 transition-all focus:bg-white resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Photos & Assets */}
            <section className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-blue-900/5 rounded-[2.5rem] p-8 md:p-10 space-y-8 transition-all hover:shadow-blue-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                    <Camera size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Asset Gallery</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">High-quality visual proof</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 group shadow-sm border border-gray-100"
                  >
                    <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="bg-white text-red-600 p-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="aspect-square border-2 border-dashed border-blue-100 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:bg-blue-50/50 hover:border-blue-400 transition-all relative group overflow-hidden">
                  {uploading ? (
                    <Loader2 className="animate-spin text-blue-600" />
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                      </div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Add Asset</span>
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
            </section>

            {/* Location & Map Section */}
            <section className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-blue-900/5 rounded-[2.5rem] p-8 md:p-10 space-y-8 transition-all hover:shadow-blue-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Location Details</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Precise geolocating</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${showMap ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  <MapPin size={16} />
                  {showMap ? "Confirm Location" : "Show Map View"}
                </button>
              </div>

              {showMap && (
                <div className="rounded-[2rem] overflow-hidden border-4 border-white shadow-xl animate-in zoom-in duration-500">
                  <MapLocationPicker onLocationSelect={handleMapLocationSelect} />
                </div>
              )}

              <input type="hidden" {...register("latitude", { valueAsNumber: true })} />
              <input type="hidden" {...register("longitude", { valueAsNumber: true })} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Exact Address</label>
                  <div className="relative group">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors transition-colors" size={18} />
                    <input
                      {...register("address")}
                      placeholder="e.g. Sector 5, Near Salt Lake Mall"
                      className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-gray-700 transition-all focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pincode</label>
                  <div className="relative">
                    <input
                      value={watch("zipCode") || ""}
                      onChange={handlePincodeChange}
                      placeholder="6-digit ZIP"
                      className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-gray-700 transition-all focus:bg-white"
                    />
                    {pincodeLoading && (
                      <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-blue-600" size={18} />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">City</label>
                  <input
                    {...register("city")}
                    placeholder="City"
                    className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-gray-700 transition-all focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Area</label>
                  <input
                    {...register("area")}
                    placeholder="Area"
                    className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-gray-700 transition-all focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">State</label>
                  <input
                    {...register("state")}
                    placeholder="State"
                    className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-gray-700 transition-all focus:bg-white"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Specs, Pricing, & Actions */}
          <div className="lg:col-span-4 space-y-8">
            {/* Specs & Pricing Card */}
            <section className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-blue-900/5 rounded-[2.5rem] p-8 space-y-8 sticky top-24">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Technical Specs</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dimensions & Pricing</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Type</label>
                      <select
                        {...register("type")}
                        className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                      >
                        <option value="Billboard">Billboard</option>
                        <option value="Unipole">Unipole</option>
                        <option value="Gantry">Gantry</option>
                        <option value="Bus Shelter">Bus Shelter</option>
                        <option value="Kiosk">Kiosk</option>
                        <option value="Other">Other</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Lighting</label>
                      <select
                        {...register("lightingType")}
                        className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                      >
                        <option value="Non-Lit">Non-Lit</option>
                        <option value="Lit">Lit</option>
                        <option value="Front Lit">Front Lit</option>
                        <option value="Back Lit">Back Lit</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Dimensions (Ft)</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                       <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                       <input
                        {...register("width", { valueAsNumber: true })}
                        type="number"
                        placeholder="W"
                        className="w-full pl-9 pr-3 py-3.5 bg-gray-50 border-none rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                    <span className="self-center font-black text-gray-300">X</span>
                    <div className="relative flex-1">
                       <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={14} />
                       <input
                        {...register("height", { valueAsNumber: true })}
                        type="number"
                        placeholder="H"
                        className="w-full pl-9 pr-3 py-3.5 bg-gray-50 border-none rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Monthly Rental (Base)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                    <input
                      {...register("pricePerMonth", { valueAsNumber: true })}
                      type="number"
                      placeholder="0,000"
                      className="w-full pl-14 pr-5 py-4 bg-blue-50/50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-black text-xl text-blue-900 transition-all focus:bg-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <Zap size={16} className="shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Property Metadata</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      {...register("hoardingCode")}
                      placeholder="Unique Property Code"
                      className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <input
                      {...register("trafficFrom")}
                      placeholder="Daily Traffic Flow"
                      className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">Reach/Wk</label>
                      <input
                        {...register("uniqueReach", { valueAsNumber: true })}
                        type="number"
                        className="w-full px-2 py-1.5 bg-white border border-indigo-100 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">Footfall/Wk</label>
                      <input
                        {...register("uniqueFootfall", { valueAsNumber: true })}
                        type="number"
                        className="w-full px-2 py-1.5 bg-white border border-indigo-100 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Min. Booking Period (Months)</label>
                  <select
                    {...register("minimumBookingMonths", { valueAsNumber: true })}
                    className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                  >
                    {[1, 2, 3, 6, 12].map(m => (
                      <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Min. Booking Amount </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      {...register("minimumBookingAmount", { valueAsNumber: true })}
                      type="number"
                      placeholder="Same as monthly if empty"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-sm text-gray-700 focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                {/* Final Actions */}
                <div className="pt-6 border-t border-gray-100 italic text-[10px] text-gray-400 font-medium text-center">
                  All changes are saved to our secure cloud servers.
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}
