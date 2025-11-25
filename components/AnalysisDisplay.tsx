import React from 'react';
import { AnalysisResult } from '../types';
import { Map, ExternalLink, Search, MapPin } from 'lucide-react';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  // Simple markdown-like parser for bold text to make it look nicer
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-3 text-slate-300 leading-relaxed">
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

      <div className="prose prose-invert max-w-none">
        {renderText(result.text)}
      </div>

      {hasGrounding && (
        <div className="mt-8 pt-6 border-t border-slate-700/50">
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