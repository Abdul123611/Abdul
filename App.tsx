
import React, { useState, useEffect } from 'react';
import { geminiService } from './services/geminiService';
import { AutomationPackage, ImageSize } from './types';
import { AssetCard } from './components/AssetCard';
import { ChatBot } from './components/ChatBot';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<AutomationPackage | null>(null);
  const [history, setHistory] = useState<AutomationPackage[]>([]);
  const [selectedSize, setSelectedSize] = useState<ImageSize>(ImageSize.K1);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('tubemagic_projects');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (pkg: AutomationPackage) => {
    const updated = [pkg, ...history.filter(p => p.id !== pkg.id)].slice(0, 15);
    setHistory(updated);
    localStorage.setItem('tubemagic_projects', JSON.stringify(updated));
  };

  const handleStartAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    try {
      const result = await geminiService.generateAutomationPackage(prompt);
      setProject(result);
      saveToHistory(result);
    } catch (err: any) {
      setError("Automation sequence interrupted. Please try a different topic.");
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
        return true; 
      }
    }
    return true;
  };

  const handleGenerateImage = async (sceneId: string, size: ImageSize) => {
    if (!project) return;
    await checkAndOpenKeySelector();
    setProject(prev => prev ? {
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isGenerating: true, videoUrl: undefined } : s)
    } : null);

    try {
      const scene = project.scenes.find(s => s.id === sceneId);
      if (!scene) return;
      const imageUrl = await geminiService.generateImage(scene.visualPrompt, size);
      setProject(prev => {
        if (!prev) return null;
        const next = {
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, imageUrl, isGenerating: false } : s)
        };
        saveToHistory(next);
        return next;
      });
    } catch (err) {
      setProject(prev => prev ? {
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isGenerating: false } : s)
      } : null);
    }
  };

  const handleGenerateVideo = async (sceneId: string) => {
    if (!project) return;
    await checkAndOpenKeySelector();
    setProject(prev => prev ? {
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isVideoGenerating: true, imageUrl: undefined } : s)
    } : null);

    try {
      const scene = project.scenes.find(s => s.id === sceneId);
      if (!scene) return;
      const videoUrl = await geminiService.generateVideo(scene.visualPrompt);
      setProject(prev => {
        if (!prev) return null;
        const next = {
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, videoUrl, isVideoGenerating: false } : s)
        };
        saveToHistory(next);
        return next;
      });
    } catch (err) {
      setProject(prev => prev ? {
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isVideoGenerating: false } : s)
      } : null);
    }
  };

  const reset = () => {
    setProject(null);
    setPrompt('');
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-['Inter']">
      {/* Sidebar Navigation */}
      <aside className={`bg-[#111] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out z-50 shadow-2xl ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-6 border-b border-white/5 h-20 flex items-center gap-4 overflow-hidden">
           <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-600/20">
             <i className="fa-solid fa-bolt text-white text-lg"></i>
           </div>
           {sidebarOpen && <span className="font-black text-xl tracking-tighter uppercase italic">TubeMagic<span className="text-red-600">Pro</span></span>}
        </div>
        
        <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1 custom-scrollbar">
          <button 
            onClick={reset}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${!project ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'hover:bg-white/5 text-neutral-500 hover:text-white'}`}
          >
            <i className="fa-solid fa-plus w-6 text-center text-lg"></i>
            {sidebarOpen && <span className="font-bold text-sm">New Production</span>}
          </button>
          
          <div className="mt-8 space-y-2">
            {sidebarOpen && <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-widest px-4 mb-4">Project Library</h3>}
            {history.map(p => (
              <button 
                key={p.id}
                onClick={() => setProject(p)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${project?.id === p.id ? 'bg-white/5 border-white/10 text-white' : 'border-transparent hover:bg-white/5 text-neutral-500 hover:text-white text-left'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-clapperboard text-[10px]"></i>
                </div>
                {sidebarOpen && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{p.youtubeTitle || 'Untitled'}</p>
                    <p className="text-[9px] font-mono text-neutral-600">{new Date(p.timestamp).toLocaleDateString()}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-6 border-t border-white/5 text-neutral-600 hover:text-white transition-colors"
        >
          <i className={`fa-solid ${sidebarOpen ? 'fa-angles-left' : 'fa-angles-right'} w-full text-lg`}></i>
        </button>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080808]">
        {!project ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 overflow-y-auto">
            <div className="max-w-3xl w-full text-center space-y-16 animate-in fade-in zoom-in-95 duration-700">
              <div className="space-y-6">
                <div className="inline-block bg-red-600/10 border border-red-600/20 px-4 py-1.5 rounded-full mb-4">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">AI Engine: Gemini 3.0 Ultra</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter sm:text-8xl leading-none">
                  AI YouTube <br/><span className="text-red-600">Automation.</span>
                </h1>
                <p className="text-2xl text-neutral-500 font-medium max-w-2xl mx-auto leading-relaxed">
                  Enter an idea. Generate a script. Produce cinematic visuals. <br/> dominate the algorithm.
                </p>
              </div>

              <form onSubmit={handleStartAutomation} className="space-y-6 relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your vision... (e.g. 'The dark history of the samurai' or '5 life-changing morning habits')"
                    className="w-full h-56 bg-[#111] border border-white/10 rounded-[2rem] p-8 text-xl text-white placeholder-neutral-700 focus:outline-none focus:ring-1 focus:ring-red-600/50 resize-none transition-all shadow-2xl"
                  />
                  <div className="absolute bottom-6 left-8 flex gap-4 text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2"><i className="fa-solid fa-check text-red-600"></i> Scripting</span>
                    <span className="flex items-center gap-2"><i className="fa-solid fa-check text-red-600"></i> SEO</span>
                    <span className="flex items-center gap-2"><i className="fa-solid fa-check text-red-600"></i> Assets</span>
                  </div>
                  <button
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute bottom-6 right-6 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 text-white font-black py-4 px-10 rounded-2xl shadow-xl transition-all flex items-center gap-3 transform hover:scale-[1.02]"
                  >
                    {isGenerating ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
                    )}
                    {isGenerating ? 'Synthesizing Production...' : 'Begin Production'}
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm font-bold tracking-tight">{error}</p>}
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Workspace Header */}
            <header className="h-20 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-between px-10 z-10 shrink-0">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-white truncate max-w-xl tracking-tight uppercase italic">{project.youtubeTitle}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-2"><i className="fa-solid fa-fingerprint"></i> {project.id.slice(0, 12)}</span>
                  <span className="text-[10px] text-red-600 font-black uppercase tracking-tighter">Ready for Production</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-neutral-900 px-4 py-2 rounded-xl border border-white/5">
                   <i className="fa-solid fa-expand text-neutral-500 text-xs"></i>
                   <select 
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value as ImageSize)}
                    className="bg-transparent text-[11px] font-black text-neutral-300 outline-none cursor-pointer uppercase tracking-widest"
                   >
                     <option value={ImageSize.K1}>1K Standard</option>
                     <option value={ImageSize.K2}>2K Ultra</option>
                     <option value={ImageSize.K4}>4K Master</option>
                   </select>
                </div>
                <button 
                   onClick={() => window.print()}
                   className="h-11 px-6 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black transition-all border border-white/5 uppercase tracking-widest"
                >
                  <i className="fa-solid fa-download mr-2"></i> Export Data
                </button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* Production Controls Panel */}
              <div className="w-[450px] border-r border-white/5 overflow-y-auto custom-scrollbar p-10 space-y-12 bg-[#0d0d0d]">
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">Master Script</h3>
                    <div className="flex gap-2">
                       <button className="text-[10px] font-bold text-neutral-600 hover:text-white uppercase transition-colors">Edit</button>
                       <button className="text-[10px] font-bold text-neutral-600 hover:text-white uppercase transition-colors">Copy</button>
                    </div>
                  </div>
                  <div className="bg-neutral-900/30 p-8 rounded-3xl border border-white/5 text-base leading-relaxed text-neutral-300 font-medium font-serif italic shadow-inner">
                    {project.script}
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">Voice-Over Workflow</h3>
                  <div className="space-y-3">
                     {project.voiceOver.split('\n').filter(l => l.trim()).map((line, i) => (
                       <div key={i} className="group flex gap-5 p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-all cursor-default">
                          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600/20 transition-colors">
                            <i className="fa-solid fa-microphone-lines text-red-600 text-xs"></i>
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed font-medium">{line}</p>
                       </div>
                     ))}
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">SEO Meta Data</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 bg-red-600/5 rounded-3xl border border-red-600/10">
                      <span className="text-[10px] font-black text-red-500 block mb-2 uppercase tracking-widest">Thumbnail Headline</span>
                      <p className="text-2xl font-black italic uppercase text-white leading-none tracking-tighter">{project.thumbnailText}</p>
                    </div>
                    <div className="p-5 bg-neutral-900/30 rounded-2xl border border-white/5">
                      <span className="text-[10px] text-neutral-600 block mb-3 uppercase font-black tracking-widest">Trending Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.slice(0, 6).map(tag => (
                          <span key={tag} className="text-[9px] bg-neutral-800 text-neutral-400 px-2 py-1 rounded-md font-bold">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Asset Grid (Visual Studio) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#080808]">
                <div className="max-w-[1400px] mx-auto">
                   <div className="flex items-center justify-between mb-12">
                     <div className="space-y-1">
                       <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Asset Studio</h2>
                       <p className="text-neutral-600 text-sm font-medium">Generate high-fidelity vertical content for your short-form video.</p>
                     </div>
                     <div className="text-right">
                        <span className="block text-[10px] font-black text-neutral-700 uppercase tracking-widest">Total Frames</span>
                        <span className="text-4xl font-black text-red-600">{project.scenes.length}</span>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {project.scenes.map((scene) => (
                      <AssetCard
                        key={scene.id}
                        scene={scene}
                        selectedSize={selectedSize}
                        onGenerateImage={handleGenerateImage}
                        onGenerateVideo={handleGenerateVideo}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ChatBot />
      
      {/* Global Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-[#111] border-t border-white/5 px-6 flex items-center justify-between text-[10px] text-neutral-600 z-[60]">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 font-bold uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/20"></div> Engine Status: Optimal</span>
          <span className="font-mono text-neutral-700">|</span>
          <span className="uppercase font-bold tracking-widest"><i className="fa-solid fa-server mr-2"></i> GPU Acceleration: Enabled</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="uppercase font-black text-neutral-500">{project ? 'Project Active' : 'Standby'}</span>
          <span className="font-mono uppercase text-red-600 font-black">v3.5.2 Build-Release</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
