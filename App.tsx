
import React, { useState, useEffect } from 'react';
import { geminiService } from './services/geminiService';
import { AutomationPackage, ImageSize } from './types';
import { AssetCard } from './components/AssetCard';
import { ChatBot } from './components/ChatBot';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<AutomationPackage | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>(ImageSize.K1);
  const [error, setError] = useState<string | null>(null);

  const handleStartAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    try {
      const result = await geminiService.generateAutomationPackage(prompt);
      setProject(result);
    } catch (err: any) {
      setError("Failed to generate automation package. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const checkAndOpenKeySelector = async (): Promise<boolean> => {
    // @ts-ignore
    if (typeof window.aistudio !== 'undefined' && typeof window.aistudio.hasSelectedApiKey === 'function') {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        return true; // Proceed anyway as per instructions (race condition mitigation)
      }
    }
    return true;
  };

  const handleGenerateImage = async (sceneId: string, size: ImageSize) => {
    if (!project) return;
    
    await checkAndOpenKeySelector();

    // Update state to show loading
    setProject(prev => prev ? {
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isGenerating: true } : s)
    } : null);

    try {
      const scene = project.scenes.find(s => s.id === sceneId);
      if (!scene) return;

      const imageUrl = await geminiService.generateImage(scene.visualPrompt, size);
      
      setProject(prev => prev ? {
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, imageUrl, isGenerating: false } : s)
      } : null);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Requested entity was not found")) {
        // Handle race condition/stale key
        // @ts-ignore
        await window.aistudio?.openSelectKey();
      }
      setProject(prev => prev ? {
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isGenerating: false } : s)
      } : null);
      alert("Error generating image. Check console for details.");
    }
  };

  const reset = () => {
    setProject(null);
    setPrompt('');
  };

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 to-black">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 text-6xl text-red-600 mb-6">
              <i className="fa-solid fa-play-circle animate-pulse"></i>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              TubeMagic <span className="text-red-600">AI</span>
            </h1>
            <p className="text-xl text-neutral-400 font-light">
              One prompt. One minute. One viral video package.
            </p>
          </div>

          <form onSubmit={handleStartAutomation} className="space-y-4">
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your video topic (e.g., 'The secrets of high-performance habits' or 'A futuristic travel guide to Mars')..."
                className="w-full h-40 bg-neutral-900/50 border border-white/10 rounded-3xl p-6 text-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all backdrop-blur-sm"
              />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur opacity-10 group-focus-within:opacity-20 transition duration-1000"></div>
            </div>
            
            <button
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 text-white font-bold py-4 rounded-full text-xl shadow-lg transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02]"
            >
              {isGenerating ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating Magic...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-magic"></i>
                  Start YouTube Automation
                </>
              )}
            </button>
          </form>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          
          <div className="grid grid-cols-3 gap-6 pt-8 text-neutral-500">
            <div className="space-y-1">
              <i className="fa-solid fa-pen-fancy text-xl"></i>
              <p className="text-xs uppercase font-bold tracking-widest">Scripting</p>
            </div>
            <div className="space-y-1">
              <i className="fa-solid fa-bullhorn text-xl"></i>
              <p className="text-xs uppercase font-bold tracking-widest">Metadata</p>
            </div>
            <div className="space-y-1">
              <i className="fa-solid fa-camera-movie text-xl"></i>
              <p className="text-xs uppercase font-bold tracking-widest">Visuals</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-lg">
        <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
          <i className="fa-solid fa-play-circle text-red-600 text-2xl"></i>
          <span className="font-bold text-xl tracking-tighter">TUBEMAGIC <span className="text-red-600">AI</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-neutral-900 px-4 py-1.5 rounded-full border border-white/5">
             <span className="text-xs font-bold text-neutral-400 uppercase">Image Size</span>
             <select 
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value as ImageSize)}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
             >
               <option value={ImageSize.K1} className="bg-neutral-900">1K (Standard)</option>
               <option value={ImageSize.K2} className="bg-neutral-900">2K (High Res)</option>
               <option value={ImageSize.K4} className="bg-neutral-900">4K (Ultra)</option>
             </select>
          </div>
          <button 
            onClick={reset}
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <i className="fa-solid fa-plus-circle"></i>
            New Project
          </button>
        </div>
      </nav>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Panel: Content & Metadata */}
        <div className="lg:col-span-4 border-r border-white/5 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#0a0a0a]">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <i className="fa-solid fa-file-alt text-red-600"></i>
              The Script
            </h2>
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 whitespace-pre-wrap leading-relaxed text-neutral-300">
              {project.script}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <i className="fa-solid fa-microphone text-red-600"></i>
              Voice-Over Guide
            </h2>
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 whitespace-pre-wrap font-mono text-sm text-neutral-400 italic">
              {project.voiceOver}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <i className="fa-solid fa-chart-line text-red-600"></i>
              SEO Metadata
            </h2>
            <div className="space-y-4">
              <div className="bg-neutral-900/50 p-4 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-neutral-500 uppercase mb-1">YouTube Title</p>
                <p className="text-white font-semibold">{project.youtubeTitle}</p>
              </div>
              <div className="bg-neutral-900/50 p-4 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Description</p>
                <p className="text-neutral-400 text-sm">{project.youtubeDescription}</p>
              </div>
              <div className="bg-neutral-900/50 p-4 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Tags</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.tags.map(tag => (
                    <span key={tag} className="bg-neutral-800 text-xs px-2 py-1 rounded text-neutral-400">#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/20">
                <p className="text-xs font-bold text-red-500 uppercase mb-1">Thumbnail Hook</p>
                <p className="text-white font-bold text-lg uppercase tracking-tight">{project.thumbnailText}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Center Panel: Visual Studio */}
        <div className="lg:col-span-8 overflow-y-auto custom-scrollbar p-8 bg-black">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-extrabold text-white">Visual Studio</h2>
                <p className="text-neutral-500">Generate high-quality cinematic frames for your scenes.</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-neutral-600 uppercase">Scene Count</p>
                <p className="text-2xl font-bold text-red-600">{project.scenes.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {project.scenes.map((scene) => (
                <AssetCard
                  key={scene.id}
                  scene={scene}
                  selectedSize={selectedSize}
                  onGenerate={handleGenerateImage}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <ChatBot />
    </div>
  );
};

export default App;
