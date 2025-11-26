import React from 'react';
import { AnalysisResult } from '../types';
import { Map, ExternalLink, Search, MapPin, Layers } from 'lucide-react';

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
        <p key={i} className={`mb-3 text-slate-300 leading-relaxed ${isList ? 'pl-4 border-l-2 border-cyan-500/30 ml-2' : ''}`}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-cyan-300 font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const hasGrounding = result.groundingMetadata?.groundingChunks && result.groundingMetadata.groundingChunks.length > 0;

  return (
    <div className="w-full bg-slate-800/50 rounded-xl border border-slate-700 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-6">
        <Map className="text-cyan-400 w-5 h-5" />
        <h2 className="text-xl font-bold text-white uppercase tracking-wide">Location Analysis</h2>
      </div>

      <div className="prose prose-invert max-w-none mb-8">
        {renderText(displayText)}
      </div>

      {/* Embedded Map Section */}
      {latitude && longitude && (
        <div className="mb-8 overflow-hidden rounded-xl border border-slate-700 shadow-xl bg-slate-900">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
             <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
               <Layers className="w-4 h-4" />
               Satellite View
             </div>
             <div className="text-xs text-slate-500">
               {parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}
             </div>
          </div>
          <div className="w-full h-80 md:h-96 bg-slate-900 relative">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://maps.google.com/maps?q=${latitude},${longitude}&t=k&z=19&ie=UTF8&iwloc=&output=embed`}
              className="w-full h-full filter saturate-[0.8] contrast-[1.1]"
              title="Satellite Map"
            />
          </div>
        </div>
      )}

      {hasGrounding && (
        <div className="pt-6 border-t border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Verified Sources
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
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700 hover:border-cyan-500/30 transition-all group"
                  >
                    <span className="text-sm text-cyan-200 truncate pr-4">{chunk.web.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
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
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700 hover:border-green-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                       <MapPin className="w-3 h-3 text-green-400 shrink-0" />
                       <span className="text-sm text-green-200 truncate">{chunk.maps.title}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-green-400" />
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