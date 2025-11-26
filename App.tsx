import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { fileToBase64, isValidFileType } from './utils/fileHelpers';
import { analyzeMedia } from './services/geminiService';
import { AnalysisResult, FileData, InputMode } from './types';
import { UploadCloud, Youtube, X, Loader2, Image as ImageIcon, Video as VideoIcon, MapPin, Plus, Link as LinkIcon, Clock, Timer, Search } from 'lucide-react';

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
      setError("MAX 5 FILES ALLOWED.");
      return;
    }

    for (const file of filesArray) {
      if (!isValidFileType(file)) {
        setError(`"${file.name}" INVALID TYPE. IMAGES OR VIDEO ONLY.`);
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        setError(`"${file.name}" TOO BIG. MAX 20MB.`);
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
        setError("FILE PROCESS ERROR.");
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
        await analyzeMedia(prompt, [], sourceUrl).then(setResult); 
      }
    } catch (err) {
      setError("ANALYSIS FAILED. TRY AGAIN.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-900 text-neutral-100 selection:bg-yellow-400 selection:text-black">
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* Intro Section */}
        <div className="text-center space-y-2 py-8">
          <div className="inline-block relative">
            <h2 className="text-5xl md:text-7xl font-marker transform -rotate-1 text-white drop-shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
              WHERE'S THAT SPOT?
            </h2>
            <div className="absolute -bottom-2 right-0 w-full h-2 bg-yellow-400 -rotate-1 skew-x-12"></div>
          </div>
          <p className="font-typewriter text-neutral-400 max-w-2xl mx-auto text-sm md:text-base mt-6 border-l-4 border-yellow-400 pl-4 text-left md:text-center md:border-none md:pl-0">
            Upload raw footy or drop a YouTube link. We'll find the concrete.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-neutral-800 border-4 border-neutral-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
          {/* Tabs */}
          <div className="flex border-b-4 border-neutral-700">
            <button
              onClick={() => { setMode(InputMode.UPLOAD); setResult(null); setError(null); }}
              className={`flex-1 py-4 text-center font-marker text-xl tracking-wide transition-all flex items-center justify-center gap-2 ${
                mode === InputMode.UPLOAD 
                ? 'bg-neutral-800 text-yellow-400' 
                : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <UploadCloud className="w-6 h-6" strokeWidth={2.5} />
              UPLOAD
            </button>
            <button
              onClick={() => { setMode(InputMode.YOUTUBE); setResult(null); setError(null); }}
              className={`flex-1 py-4 text-center font-marker text-xl tracking-wide transition-all flex items-center justify-center gap-2 border-l-4 border-neutral-700 ${
                mode === InputMode.YOUTUBE 
                ? 'bg-neutral-800 text-pink-500' 
                : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Youtube className="w-6 h-6" strokeWidth={2.5} />
              YOUTUBE
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* Upload Mode */}
            {mode === InputMode.UPLOAD && (
              <div className="space-y-6">
                
                {/* Drag & Drop Zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-4 border-dashed p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group min-h-[200px] ${
                    isDragging 
                    ? 'border-yellow-400 bg-yellow-400/10' 
                    : 'border-neutral-600 hover:border-white hover:bg-neutral-700/50'
                  }`}
                >
                  <div className={`p-4 transition-transform group-hover:scale-110 duration-300`}>
                    <UploadCloud className={`w-12 h-12 ${isDragging ? 'text-yellow-400' : 'text-neutral-400 group-hover:text-white'}`} strokeWidth={1.5} />
                  </div>
                  <div className="text-center font-typewriter">
                    <p className="text-lg text-neutral-200">
                      {isDragging ? 'DROP IT LIKE ITS HOT' : 'DROP FILES OR CLICK'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-2 uppercase">
                      JPG, PNG, MP4, MOV (MAX 5)
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2">
                    {filesData.map((data, idx) => (
                      <div key={idx} className="relative group border-2 border-neutral-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-neutral-900 aspect-square">
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-black border-2 border-black hover:scale-110 transition-transform z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        <div className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-300">
                          {data.mimeType.startsWith('video/') ? (
                            <video src={data.previewUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={data.previewUrl} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          )}
                        </div>
                        
                        <div className="absolute bottom-0 inset-x-0 p-1 bg-black/80 flex items-center gap-2 border-t border-neutral-700">
                           {data.mimeType.startsWith('video/') ? <VideoIcon className="w-3 h-3 text-yellow-400"/> : <ImageIcon className="w-3 h-3 text-pink-400"/>}
                           <span className="text-[10px] font-typewriter text-neutral-300 truncate uppercase">{data.file.name}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add more button */}
                    {filesData.length < 5 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-600 hover:border-yellow-400 hover:text-yellow-400 aspect-square text-neutral-500 transition-colors font-typewriter group"
                      >
                         <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                         <span className="text-xs">ADD ANGLE</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Source URL Input */}
                <div className="border-t-4 border-neutral-700/50 pt-6">
                  <label className="block text-sm font-marker text-neutral-400 mb-2 uppercase tracking-wide">
                    Source Link (Optional)
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="HTTPS://..."
                      className="w-full bg-neutral-900 border-2 border-neutral-600 rounded-none py-3 pl-11 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-400 focus:bg-black transition-all font-typewriter"
                    />
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-yellow-400 w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* YouTube Mode */}
            {mode === InputMode.YOUTUBE && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-marker text-neutral-400 mb-2 uppercase tracking-wide">Video URL</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="HTTPS://YOUTUBE.COM/..."
                      className="w-full bg-neutral-900 border-2 border-neutral-600 rounded-none py-4 px-5 text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500 focus:bg-black transition-all font-typewriter"
                    />
                    <Youtube className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-pink-500 w-6 h-6" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-marker text-neutral-400 mb-2 uppercase tracking-wide">Start Timestamp</label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={youtubeStartTime}
                        onChange={(e) => setYoutubeStartTime(e.target.value)}
                        placeholder="E.G. 2:15"
                        className="w-full bg-neutral-900 border-2 border-neutral-600 rounded-none py-3 px-4 pl-10 text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500 focus:bg-black transition-all font-typewriter"
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-pink-500 w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-marker text-neutral-400 mb-2 uppercase tracking-wide">Duration (Sec)</label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={youtubeDuration}
                        onChange={(e) => setYoutubeDuration(e.target.value)}
                        placeholder="E.G. 15"
                        className="w-full bg-neutral-900 border-2 border-neutral-600 rounded-none py-3 px-4 pl-10 text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500 focus:bg-black transition-all font-typewriter"
                      />
                      <Timer className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-pink-500 w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            {error && (
              <div className="mt-4 p-4 bg-red-900/10 border-2 border-red-500 text-red-500 font-typewriter text-sm text-center">
                ! {error}
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (mode === InputMode.UPLOAD && filesData.length === 0) || (mode === InputMode.YOUTUBE && !youtubeUrl)}
                className="w-full py-4 bg-white hover:bg-yellow-400 text-black font-marker text-2xl tracking-widest border-2 border-transparent hover:border-black disabled:bg-neutral-800 disabled:text-neutral-600 disabled:border-neutral-700 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 group"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="animate-pulse">SCOUTING...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    FIND THE SPOT
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && <AnalysisDisplay result={result} />}

      </main>

      <footer className="p-8 text-center text-neutral-600 text-xs font-typewriter border-t border-neutral-800 mt-8">
        <p>BUILT WITH GEMINI 2.5 FLASH. &copy; {new Date().getFullYear()} STREET SPOT LOCATOR.</p>
      </footer>
    </div>
  );
};

export default App;