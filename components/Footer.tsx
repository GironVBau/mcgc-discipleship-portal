import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-sans">
      <p className="flex items-center justify-center space-x-1">
        <span>Designed & Developed by</span>
        <span className="font-semibold text-slate-300 hover:text-amber-400 transition-colors">
          Viz Giron
        </span>
      </p>
    </footer>
  );
}