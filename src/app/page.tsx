import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import HowItWorks from "@/components/HowItWorks";
import FeaturedLocations from "@/components/FeaturedLocations";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Target Image Hero Section */}
      <section id="home" className="relative w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-[#e6f0fa] pt-16 pb-12 overflow-hidden">
        
        <div className="max-w-7xl mx-auto w-full relative z-20 flex flex-col items-center justify-center space-y-8">
          
          <div className="max-w-4xl text-center flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-black text-[#0f172a] tracking-tight leading-[1.05] antialiased">
              Find the <span className="italic underline underline-offset-8 decoration-blue-950">Perfect</span> <br /> Hoarding Space
            </h1>
          </div>

          <div className="w-full max-w-4xl mx-auto px-4 sm:px-0 pointer-events-auto mt-2">
            <SearchBar />
          </div>

        </div>
      </section>

      <FeaturedLocations />

      <HowItWorks />

    </div>
  );
}
