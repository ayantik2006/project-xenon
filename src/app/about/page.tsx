import Image from "next/image";
import { Building2, Target, Users, Award, User } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Modern About & Features Split Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          {/* Left Column: Heading & Content */}
          <div className="space-y-12 pr-0 lg:pr-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                About <span className="text-[#2563eb]">HoardSpace</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed font-semibold">
                Hoardspace is a digital marketplace transforming the way outdoor
                advertising is discovered, planned, and booked. Search, compare, and
                book premium locations across Indian cities through a
                transparent, technology-driven platform.
              </p>
              
              <div className="mt-12 flex flex-wrap gap-10">
                  <div className="flex flex-col">
                      <span className="text-4xl font-black text-slate-900">10k+</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#2563eb] mt-2">Premium Boards</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-4xl font-black text-slate-900">24/7</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#2563eb] mt-2">Support Team</span>
                  </div>
              </div>
            </div>
          </div>

          {/* Right Column: Billboard Image & Floating Attached Features */}
          <div className="relative h-full w-full min-h-[600px] flex items-center justify-center mt-12 lg:mt-0">
            {/* Image Container */}
            <div className="relative w-full max-w-sm lg:max-w-md aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/20 border-8 border-white mx-auto z-10">
              <Image
                src="/billboard.jpg"
                alt="HoardSpace Premium Billboard"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2563eb]/20 via-transparent to-transparent pointer-events-none mix-blend-multiply"></div>
            </div>

            {/* Floating Attached Feature 1: Top Left */}
            <div className="absolute top-[5%] left-0 lg:-left-12 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.2)] hover:-translate-y-1 transition-transform w-[220px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg shrink-0">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 leading-tight">Premium Locations</h3>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed pl-1">Prime hoarding spots across India.</p>
            </div>

            {/* Floating Attached Feature 2: Top Right */}
            <div className="absolute top-[25%] right-0 lg:-right-8 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.2)] hover:-translate-y-1 transition-transform w-[220px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#2563eb] rounded-lg shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 leading-tight">Verified Vendors</h3>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed pl-1">Strict KYC for security & trust.</p>
            </div>

            {/* Floating Attached Feature 3: Bottom Left */}
            <div className="absolute bottom-[25%] left-4 lg:-left-4 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.2)] hover:-translate-y-1 transition-transform w-[220px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg shrink-0">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 leading-tight">Transparent Pricing</h3>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed pl-1">Clear pricing. No hidden costs.</p>
            </div>

            {/* Floating Attached Feature 4: Bottom Right */}
            <div className="absolute bottom-[5%] right-4 lg:-right-4 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.2)] hover:-translate-y-1 transition-transform w-[220px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg shrink-0">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 leading-tight">Easy Booking</h3>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed pl-1">Instant secure online payments.</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h2 className="text-sm font-black text-[#2563eb] tracking-[0.2em] uppercase mb-4">Our People</h2>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6">
              Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-orange-500">Team</span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed">
              Driven by innovation and expertise, our team is committed to
              transforming outdoor advertising in India
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 hover:border-[#2563eb] hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-slate-50 shadow-md group-hover:border-blue-100 transition-colors">
                  <Image
                    src="https://res.cloudinary.com/du5qoczcn/image/upload/v1773081079/IMG_2169_ealh6r.jpg"
                    alt="Debi Prasad Sahoo"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Debi Prasad Sahoo
                </h3>
                <p className="text-[#2563eb] font-bold mb-3">
                  Founder & CEO
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Chemical Engineering
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* CTO */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 hover:border-[#2563eb] hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-slate-50 shadow-md group-hover:border-blue-100 transition-colors">
                  <Image
                    src="https://avatars.githubusercontent.com/u/99005057?v=4"
                    alt="Ayantik Sarkar"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Ayantik Sarkar
                </h3>
                <p className="text-[#2563eb] font-bold mb-3">
                  CTO
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Civil Engineering
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 hover:border-[#2563eb] hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-slate-50 shadow-md group-hover:border-blue-100 transition-colors">
                  <Image
                    src="/arka.jpeg"
                    alt="Arka Pal"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Arka Pal
                </h3>
                <p className="text-[#2563eb] font-bold mb-3">
                  Frontend Developer
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Computer Science Engineering
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 hover:border-[#2563eb] hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-slate-50 shadow-md group-hover:border-blue-100 transition-colors">
                  <Image
                    src="/shuvam.jpeg"
                    alt="Shuvam Satapathi"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Shuvam Satapathi
                </h3>
                <p className="text-[#2563eb] font-bold mb-3">
                  Full Stack Developer
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Artificial Intelligence
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* Team Member 8 */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 hover:border-[#2563eb] hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-slate-50 shadow-md group-hover:border-blue-100 transition-colors">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081079/IMG_2174_b7n0re.jpg"}

                     alt="Durgaprasad Sahoo"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Durgaprasad Sahoo
                </h3>
                <p className="text-[#2563eb] font-bold mb-3">
                  Co-founder
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Artificial Intelligence
                  <br />& Machine Learning
                </p>
              </div>
            </div>

            {/* Team Member 4 */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 hover:border-[#2563eb] hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-slate-50 shadow-md group-hover:border-blue-100 transition-colors">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081084/IMG_2175_yzl7jc.jpg"}
                     alt="Preetam Samal"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Preetam Samal
                </h3>
                <p className="text-[#2563eb] font-bold mb-3">
                  Head of Marketing
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Food Processing
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* Team Member 5 */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 hover:border-[#2563eb] hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-slate-50 shadow-md group-hover:border-blue-100 transition-colors">
                  <Image
                  src={"/debansh.jpeg"}
                    alt="Debansh Sahu"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Debansh Sahu
                </h3>
                <p className="text-[#2563eb] font-bold mb-3">
                  Co-founder
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Computer Science
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* Team Member 6 */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 hover:border-[#2563eb] hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-slate-50 shadow-md group-hover:border-blue-100 transition-colors">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081077/IMG_2168_s7qqig.jpg"}
                    alt="Churepally Neha"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Churepally Neha
                </h3>
                <p className="text-[#2563eb] font-bold mb-3">
                  Graphic Designer
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Civil Engineering
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* Team Member 9 */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 hover:border-[#2563eb] hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-2">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-slate-50 shadow-md group-hover:border-blue-100 transition-colors">
                  <Image
                  src={"/pulin.jpeg"}
                     alt="Pulin Mohapatra"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Pulin Mohapatra
                </h3>
                <p className="text-[#2563eb] font-bold mb-3">
                  Head of Business Development
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Mechanical Engineering
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
