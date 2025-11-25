import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { fileToBase64, isValidFileType } from './utils/fileHelpers';
import { analyzeMedia } from './services/geminiService';
import { AnalysisResult, FileData, InputMode } from './types';
import { UploadCloud, Youtube, X, Loader2, Image as ImageIcon, Video as VideoIcon, MapPin } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<InputMode>(InputMode.UPLOAD);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidFileType(file)) {
      setError("Please upload a valid image (JPG, PNG, WebP) or video (MP4, WebM, MOV).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File size too large. Please upload files smaller than 20MB for this demo.");
      return;
    }

    setError(null);
    setResult(null);
    
    try {
      const base64 = await fileToBase64(file);
      setFileData({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type
      });
    } catch (err) {
      setError("Failed to process file.");
      console.error(err);
    }
  };

  const clearFile = () => {
    if (fileData?.previewUrl) {
      URL.revokeObjectURL(fileData.previewUrl);
    }
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (mode === InputMode.UPLOAD && !fileData) return;
    if (mode === InputMode.YOUTUBE && !youtubeUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let prompt = "";
      if (mode === InputMode.UPLOAD) {
        prompt = "Analyze this visual content. Identify the exact skateboarding or snowboarding location depicted. Look at landmarks, obstacles, and scenery.";
        await analyzeMedia(prompt, fileData!.base64, fileData!.mimeType).then(setResult);
      } else {
        prompt = `I found a skateboarding or snowboarding video at this URL: ${youtubeUrl}. \n\nCan you tell me where this was filmed? Use Google Search to find information about this specific video or the spot described in its title/description. Identify the location name and coordinates if possible.`;
        // For YouTube, we send no binary data, just the prompt
        await analyzeMedia(prompt, null, null).then(setResult);
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
            Upload a clip or photo from your favorite shred flick, or drop a YouTube link. 
            Our AI will scout the globe to pinpoint the exact location.
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
                {!fileData ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-600 rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-cyan-500 hover:bg-slate-700/20 transition-all group"
                  >
                    <div className="p-4 bg-slate-700 rounded-full group-hover:bg-slate-600 transition-colors">
                      <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-slate-200">Click to upload image or video</p>
                      <p className="text-sm text-slate-500 mt-1">Supports JPG, PNG, MP4, MOV (Max 20MB)</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-black border border-slate-700 shadow-lg">
                    <button 
                      onClick={clearFile}
                      className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-all z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="flex justify-center bg-dots-pattern">
                      {fileData.mimeType.startsWith('video/') ? (
                        <video src={fileData.previewUrl} controls className="max-h-[400px] w-auto" />
                      ) : (
                        <img src={fileData.previewUrl} alt="Preview" className="max-h-[400px] w-auto object-contain" />
                      )}
                    </div>
                    
                    <div className="p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
                       <span className="text-sm text-slate-400 flex items-center gap-2">
                          {fileData.mimeType.startsWith('video/') ? <VideoIcon className="w-4 h-4"/> : <ImageIcon className="w-4 h-4"/>}
                          {fileData.file.name}
                       </span>
                    </div>
                  </div>
                )}
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
                disabled={isAnalyzing || (mode === InputMode.UPLOAD && !fileData) || (mode === InputMode.YOUTUBE && !youtubeUrl)}
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