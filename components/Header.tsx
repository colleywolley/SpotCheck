import React from 'react';
import { MapPin, Skull } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full p-4 md:p-6 flex items-center justify-between border-b-4 border-neutral-800 bg-neutral-900/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="bg-yellow-400 p-2 -rotate-3 border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
          <Skull className="text-black w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-marker tracking-widest text-white leading-none -ml-1 uppercase">
            WHERE'S THAT <span className="text-yellow-400">SPOT?</span>
          </h1>
          <p className="font-typewriter text-neutral-400 text-[10px] md:text-xs tracking-widest bg-neutral-950 px-1 mt-1 border border-neutral-700 inline-block w-fit">
            STREET SPOT LOCATOR
          </p>
        </div>
      </div>
      
      <div className="hidden sm:flex items-center gap-2 font-typewriter text-neutral-500 text-xs border border-neutral-700 px-3 py-1 rounded-full">
        <MapPin className="w-3 h-3" />
        <span>GEMINI 2.5 POWERED</span>
      </div>
    </header>
  );
};