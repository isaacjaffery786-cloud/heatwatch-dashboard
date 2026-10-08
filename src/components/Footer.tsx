export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-[#070b14]/80">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-1 px-4 py-6 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-slate-300">
          HEATWATCH | Heatwave Monitoring &amp; Early Warning System
        </p>
        <p className="text-xs text-slate-500">
          Dataset: 50,000 environmental observations
        </p>
      </div>
    </footer>
  );
}
