import Link from "next/link";
import { Compass, Home, Search, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-10rem)] bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white/90 p-8 shadow-xl shadow-blue-100/60 sm:p-12">
            <div className="absolute -left-14 -top-14 h-40 w-40 rounded-full bg-blue-100/70 blur-2xl" />
            <div className="absolute -bottom-16 right-0 h-48 w-48 rounded-full bg-orange-100/80 blur-2xl" />

            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
                <Compass size={14} />
                Lost In The Hoardings
              </div>

              <p className="text-6xl font-black leading-none text-blue-600 sm:text-7xl">
                404
              </p>
              <h1 className="mt-4 max-w-xl text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                This page took a wrong turn.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-500 sm:text-lg">
                The page you are looking for may have moved, expired, or never
                existed. Let&apos;s get you back to a place worth advertising.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700"
                >
                  <Home size={16} />
                  Back Home
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition-all hover:border-blue-200 hover:text-blue-600"
                >
                  <Search size={16} />
                  Explore Listings
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-5">
            <div className="rounded-[2rem] border border-slate-100 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-200">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
                Quick Routes
              </p>
              <div className="mt-6 space-y-4">
                <Link
                  href="/buyer/dashboard"
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-5 py-4 transition-colors hover:bg-white/10"
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-white">
                      Buyer Dashboard
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Review campaigns, wishlist, and booking updates.
                    </p>
                  </div>
                  <ArrowRight size={18} className="shrink-0 text-cyan-300" />
                </Link>
                <Link
                  href="/vendor/dashboard"
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-5 py-4 transition-colors hover:bg-white/10"
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-white">
                      Vendor Dashboard
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Manage listings, calendars, and booking requests.
                    </p>
                  </div>
                  <ArrowRight size={18} className="shrink-0 text-cyan-300" />
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-5 py-4 transition-colors hover:bg-white/10"
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-white">
                      Contact Support
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Reach out if a broken link brought you here.
                    </p>
                  </div>
                  <ArrowRight size={18} className="shrink-0 text-cyan-300" />
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-lg shadow-orange-100/50">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-600">
                Tip
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                If you typed the URL manually, check the spelling. If you clicked
                an old link, head to <Link href="/explore" className="text-blue-600 hover:underline">Explore</Link> to
                browse available hoardings instead.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
