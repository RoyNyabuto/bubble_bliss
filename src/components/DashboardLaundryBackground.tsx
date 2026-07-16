export default function DashboardLaundryBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=2000&q=80')"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/85 to-black/95" />

      <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute top-20 right-8 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="absolute inset-0 opacity-25">
        <div className="absolute left-[8%] top-[18%] h-8 w-8 rounded-full border border-white/40" />
        <div className="absolute left-[22%] top-[34%] h-5 w-5 rounded-full border border-white/30" />
        <div className="absolute left-[44%] top-[22%] h-10 w-10 rounded-full border border-white/30" />
        <div className="absolute right-[18%] top-[28%] h-7 w-7 rounded-full border border-white/35" />
        <div className="absolute right-[30%] top-[44%] h-6 w-6 rounded-full border border-white/30" />
        <div className="absolute left-[30%] bottom-[24%] h-9 w-9 rounded-full border border-white/35" />
        <div className="absolute right-[10%] bottom-[20%] h-12 w-12 rounded-full border border-white/30" />
      </div>
    </div>
  );
}
