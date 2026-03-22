import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import AboutSection from "@/app/about/page";
import "@fontsource/chiron-goround-tc";

export default function Home() {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Left-Aligned Hero Section */}
      <section id="home" className="relative w-full min-h-[65vh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
        {/* Subtle Decorative Gradients */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 translate-y-1/4 w-[400px] h-[400px] bg-orange-100/50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        {/* Artistic Blended Billboard Imagery */}
        
        

        <div className="max-w-7xl mx-auto w-full pt-4 pb-16 relative z-20 flex flex-col items-center justify-center">
          {/* Search Bar Positioned Above Text */}
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 pointer-events-auto">
            <SearchBar />
          </div>

          <div className="max-w-4xl space-y-6 text-center flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl text-slate-900 tracking-tight leading-[1.05] antialiased">
              <span className="font-sans font-black block">Find the</span>
              <span className="font-serif italic bg-[linear-gradient(110deg,#2563eb,45%,#dbeafe,55%,#2563eb)] bg-[length:200%_auto] text-transparent bg-clip-text animate-shine pe-3 drop-shadow-sm">Perfect</span>
              <span className="font-sans font-black text-slate-900 block mt-2">Hoarding Space</span>
            </h1>
            <p
              className="text-xl md:text-3xl lg:text-[2rem] font-black text-slate-900 mx-auto max-w-3xl leading-tight antialiased drop-shadow-sm"
              style={{ fontFamily: "'Chiron GoRound TC', sans-serif" }}
            >
              Discover and book <span className="font-serif italic font-extrabold tracking-tight bg-[linear-gradient(110deg,#9333ea,45%,#f0abfc,55%,#9333ea)] bg-[length:200%_auto] text-transparent bg-clip-text animate-[shine_4s_linear_infinite_reverse] drop-shadow-md">premium</span> outdoor advertising locations across <span className="font-sans font-black text-orange-500 tracking-wider">top cities</span> in India.
            </p>
          </div>
        </div>
      </section>

      <section id="about">
        <AboutSection />
      </section>
    </div>
  );
}
