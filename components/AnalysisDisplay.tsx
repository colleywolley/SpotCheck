import React from 'react';
import { AnalysisResult } from '../types';
import { Map, ExternalLink, Search, MapPin, Layers, Crosshair } from 'lucide-react';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  // Extract coordinates if present in the text (format: COORDINATES: Lat,Lng)
  const coordRegex = /COORDINATES:\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/;
  const match = result.text.match(coordRegex);
  
  let latitude = '';
  let longitude = '';
  let displayText = result.text;

  if (match) {
    latitude = match[1];
    longitude = match[3];
    // Remove the coordinates line from the display text to keep it clean
    displayText = result.text.replace(coordRegex, '').trim();
  }

  // Simple markdown-like parser for bold text and lists to make it look nicer
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Basic list item handling
      let content = line;
      let isList = false;
      
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
         content = line.trim().substring(2);
         isList = true;
      }

      const parts = content.split(/(\*\*.*?\*\*)/g);
      
      if (!line.trim()) return null; // Skip empty lines mostly

      return (
        <p key={i} className={`mb-3 font-typewriter text-neutral-300 leading-relaxed ${isList ? 'pl-4 border-l-4 border-yellow-500 ml-2' : ''}`}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-yellow-400 font-bold tracking-wider">{part.slice(2, -2).toUpperCase()}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const hasGrounding = result.groundingMetadata?.groundingChunks && result.groundingMetadata.groundingChunks.length > 0;

  return (
    <div className="w-full bg-neutral-900 border-4 border-white shadow-[8px_8px_0px_0px_#ec4899] p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6 border-b-2 border-neutral-700 pb-4">
        <div className="p-2 bg-pink-500 border-2 border-white shadow-[2px_2px_0px_0px_#ffffff]">
            <Map className="text-white w-6 h-6" />
        </div>
        <h2 className="text-3xl font-marker text-white tracking-wider transform -rotate-1">INTEL REPORT</h2>
      </div>

      <div className="prose prose-invert max-w-none mb-8">
        {renderText(displayText)}
      </div>

      {/* Embedded Map Section */}
      {latitude && longitude && (
        <div className="mb-8 border-4 border-neutral-800 bg-black">
          <div className="bg-neutral-800 px-4 py-2 border-b-4 border-neutral-900 flex items-center justify-between">
             <div className="flex items-center gap-2 text-sm font-marker text-green-400 tracking-wider">
               <Crosshair className="w-4 h-4" />
               SATELLITE UPLINK
             </div>
             <div className="font-typewriter text-xs text-neutral-400">
               COORD: {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
             </div>
          </div>
          <div className="w-full h-80 md:h-96 bg-neutral-900 relative">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://maps.google.com/maps?q=${latitude},${longitude}&t=k&z=19&ie=UTF8&iwloc=&output=embed`}
              className="w-full h-full filter grayscale-[0.3] contrast-125"
              title="Satellite Map"
            />
          </div>
        </div>
      )}

      {hasGrounding && (
        <div className="pt-6 border-t-2 border-neutral-800 border-dashed">
          <h3 className="text-lg font-marker text-neutral-400 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            SOURCES
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.groundingMetadata?.groundingChunks?.map((chunk, idx) => {
              if (chunk.web) {
                return (
                  <a 
                    key={idx}
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-700 hover:border-yellow-400 transition-all group"
                  >
                    <span className="font-typewriter text-xs text-neutral-300 truncate pr-4 group-hover:text-yellow-400">{chunk.web.title}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-yellow-400" />
                  </a>
                );
              }
              if (chunk.maps) {
                return (
                  <a 
                    key={idx}
                    href={chunk.maps.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-700 hover:border-green-400 transition-all group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                       <MapPin className="w-3 h-3 text-green-500 shrink-0" />
                       <span className="font-typewriter text-xs text-neutral-300 truncate group-hover:text-green-400">{chunk.maps.title}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-green-400" />
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};