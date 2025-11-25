import React from 'react';
import { MapPin, Mountain } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full p-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-cyan-500 p-2 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <Mountain className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-wide text-white leading-none">
            SPOT<span className="text-cyan-400">CHECK</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">
            Action Sports Location Scout
          </p>
        </div>
      </div>
      
      <div className="hidden sm:flex items-center gap-2 text-slate-500 text-sm">
        <MapPin className="w-4 h-4" />
        <span>Powered by Gemini 2.5</span>
      </div>
    </header>
  );
};
