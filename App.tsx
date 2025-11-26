import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { fileToBase64, isValidFileType } from './utils/fileHelpers';
import { analyzeMedia } from './services/geminiService';
import { AnalysisResult, FileData, InputMode } from './types';
import { UploadCloud, Youtube, X, Loader2, Image as ImageIcon, Video as VideoIcon, MapPin, Plus, Link as LinkIcon, Clock, Timer } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<InputMode>(InputMode.UPLOAD);
  const [filesData, setFilesData] = useState<FileData[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeStartTime, setYoutubeStartTime] = useState('');
  const [youtubeDuration, setYoutubeDuration] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    const newFiles: FileData[] = [];
    const filesArray = Array.from(files);

    if (filesData.length + filesArray.length > 5) {
      setError("You can upload a maximum of 5 files.");
      return;
    }

    for (const file of filesArray) {
      if (!isValidFileType(file)) {
        setError(`"${file.name}" is not a valid file type. Please upload images or videos.`);
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        setError(`"${file.name}" is too large. Max size is 20MB per file.`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        newFiles.push({
          file,
          previewUrl: URL.createObjectURL(file),
          base64,
          mimeType: file.type
        });
      } catch (err) {
        console.error("Error processing file:", err);
        setError("Failed to process one or more files.");
      }
    }

    if (newFiles.length > 0) {
      setFilesData(prev => [...prev, ...newFiles]);
      setError(null);
      setResult(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFilesData(prev => {
      const newFiles = [...prev];
      const removed = newFiles.splice(indexToRemove, 1)[0];
      if (removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return newFiles;
    });
    setResult(null);
    if (filesData.length <= 1 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (mode === InputMode.UPLOAD && filesData.length === 0) return;
    if (mode === InputMode.YOUTUBE && !youtubeUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let prompt = "";
      if (mode === InputMode.UPLOAD) {
        prompt = "Analyze these visual inputs. Identify the exact skateboarding or snowboarding location. Look for street signs, landmarks, shop names, or specific park layouts across all images/videos provided. If you know the specific address, intersection, or block, please provide it. Otherwise, assume the neighborhood or general area.";
        
        const mediaItems = filesData.map(f => ({
          mimeType: f.mimeType,
          data: f.base64
        }));

        await analyzeMedia(prompt, mediaItems, sourceUrl).then(setResult);
      } else {
        let timeContext = "";
        if (youtubeStartTime) timeContext += ` The clip of interest starts at timestamp ${youtubeStartTime}.`;
        if (youtubeDuration) timeContext += ` The clip lasts for ${youtubeDuration} seconds.`;

        prompt = `I found a skateboarding or snowboarding video at this URL: ${youtubeUrl}.${timeContext} \n\nCan you tell me where this was filmed? I need the most specific location possible: an exact address, a street intersection, or a neighborhood. Use Google Search to verify.`;
        await analyzeMedia(prompt, [], sourceUrl).then(setResult); // Pass sourceUrl even in YT mode if user entered it
      }
    } catch (err) {
      setError("An error occurred while analyzing the location. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-cyan-500/30">
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* Intro Section */}
        <div className="text-center space-y-4 py-8">
          <h2 className="text-4xl md:text-5xl font-bold font-brand tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
            WHERE IS THAT SPOT?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Upload clips or photos (drag & drop supported) or drop a YouTube link. 
            Our AI will scout the globe to pinpoint the exact address, intersection, or neighborhood.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => { setMode(InputMode.UPLOAD); setResult(null); setError(null); }}
              className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === InputMode.UPLOAD 
                ? 'bg-slate-700/50 text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              <UploadCloud className="w-5 h-5" />
              Upload Media
            </button>
            <button
              onClick={() => { setMode(InputMode.YOUTUBE); setResult(null); setError(null); }}
              className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === InputMode.YOUTUBE 
                ? 'bg-slate-700/50 text-red-400 border-b-2 border-red-400' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              <Youtube className="w-5 h-5" />
              YouTube Link
            </button>
          </div>

          <div className="p-8">
            {/* Upload Mode */}
            {mode === InputMode.UPLOAD && (
              <div className="space-y-6">
                
                {/* Drag & Drop Zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group ${
                    isDragging 
                    ? 'border-cyan-400 bg-cyan-900/20 scale-[1.01]' 
                    : 'border-slate-600 hover:border-cyan-500 hover:bg-slate-700/20'
                  }`}
                >
                  <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-cyan-800' : 'bg-slate-700 group-hover:bg-slate-600'}`}>
                    <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-cyan-200' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-slate-200">
                      {isDragging ? 'Drop files here' : 'Click or Drag & Drop to upload'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Add multiple angles. JPG, PNG, MP4, MOV (Max 5 files)
                    </p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Previews Grid */}
                {filesData.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
                    {filesData.map((data, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden bg-black border border-slate-700 shadow-md aspect-square">
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-all z-10 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        
                        <div className="w-full h-full flex items-center justify-center bg-dots-pattern">
                          {data.mimeType.startsWith('video/') ? (
                            <video src={data.previewUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={data.previewUrl} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          )}
                        </div>
                        
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
                           {data.mimeType.startsWith('video/') ? <VideoIcon className="w-3 h-3 text-cyan-400"/> : <ImageIcon className="w-3 h-3 text-purple-400"/>}
                           <span className="text-xs text-white truncate">{data.file.name}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add more button if under limit */}
                    {filesData.length < 5 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 border border-slate-700 bg-slate-800/50 hover:bg-slate-700 rounded-lg aspect-square text-slate-500 hover:text-cyan-400 transition-colors"
                      >
                         <Plus className="w-6 h-6" />
                         <span className="text-xs font-medium">Add More</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Source URL Input */}
                <div className="border-t border-slate-700/50 pt-4">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Where did you find this? (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://instagram.com/p/..., https://thrasher.com/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-sm"
                    />
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Providing a link helps the AI identify riders, crews, or event context.
                  </p>
                </div>
              </div>
            )}

            {/* YouTube Mode */}
            {mode === InputMode.YOUTUBE && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Video URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-4 px-5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                    />
                    <Youtube className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 w-6 h-6" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Timestamp where clip starts:</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={youtubeStartTime}
                        onChange={(e) => setYoutubeStartTime(e.target.value)}
                        placeholder="e.g. 2:15"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">How many seconds is the clip?</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={youtubeDuration}
                        onChange={(e) => setYoutubeDuration(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                      />
                      <Timer className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (mode === InputMode.UPLOAD && filesData.length === 0) || (mode === InputMode.YOUTUBE && !youtubeUrl)}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.99] flex items-center justify-center gap-3"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Scouting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-6 h-6" />
                    Identify Spot
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && <AnalysisDisplay result={result} />}

      </main>

      <footer className="p-8 text-center text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} SpotCheck AI. Built with Gemini 2.5 Flash.</p>
      </footer>
    </div>
  );
};

export default App;