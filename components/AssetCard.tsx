
import React from 'react';
import { Scene, ImageSize } from '../types';

interface AssetCardProps {
  scene: Scene;
  onGenerateImage: (id: string, size: ImageSize) => void;
  onGenerateVideo: (id: string) => void;
  selectedSize: ImageSize;
}

export const AssetCard: React.FC<AssetCardProps> = ({ scene, onGenerateImage, onGenerateVideo, selectedSize }) => {
  const isAnyGenerating = scene.isGenerating || scene.isVideoGenerating;

  return (
    <div className="bg-[#151515] rounded-xl overflow-hidden border border-white/5 transition-all hover:border-red-600/50 group flex flex-col h-full shadow-2xl">
      <div className="aspect-[9/16] bg-black relative overflow-hidden flex items-center justify-center border-b border-white/5">
        {scene.videoUrl ? (
          <video 
            src={scene.videoUrl} 
            controls 
            className="w-full h-full object-cover"
            autoPlay 
            loop 
            muted 
          />
        ) : scene.imageUrl ? (
          <img 
            src={scene.imageUrl} 
            alt={scene.text} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex flex-col items-center gap-6 px-6 text-center">
            {isAnyGenerating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                  <i className={`fa-solid ${scene.isVideoGenerating ? 'fa-video' : 'fa-image'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600`}></i>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-red-600 uppercase tracking-tighter animate-pulse">
                    {scene.isVideoGenerating ? 'Rendering Frame...' : 'Synthesizing...'}
                  </p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Please Wait</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 opacity-40 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => onGenerateImage(scene.id, selectedSize)}
                    className="w-14 h-14 bg-neutral-900 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl hover:-translate-y-1"
                    title="Generate Image (Gemini 3 Pro)"
                  >
                    <i className="fa-solid fa-camera-retro text-xl"></i>
                  </button>
                  <button
                    onClick={() => onGenerateVideo(scene.id)}
                    className="w-14 h-14 bg-neutral-900 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl hover:-translate-y-1"
                    title="Generate Video (Veo 3.1)"
                  >
                    <i className="fa-solid fa-clapperboard text-xl"></i>
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Select Output Type</p>
              </div>
            )}
          </div>
        )}
        
        {/* Badge for generated content */}
        {!isAnyGenerating && (scene.imageUrl || scene.videoUrl) && (
          <div className="absolute top-4 right-4 bg-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-lg">
            {scene.videoUrl ? 'Video' : 'Image'}
          </div>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest bg-neutral-900 px-2 py-1 rounded">Scene {scene.id.split('-')[1]}</span>
          {(!isAnyGenerating && (scene.imageUrl || scene.videoUrl)) && (
            <button 
              onClick={() => scene.videoUrl ? onGenerateVideo(scene.id) : onGenerateImage(scene.id, selectedSize)}
              className="text-neutral-600 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-arrows-rotate text-xs"></i>
            </button>
          )}
        </div>
        <p className="text-sm text-neutral-200 leading-relaxed font-medium">"{scene.text}"</p>
        <div className="mt-auto pt-4 border-t border-white/5">
           <p className="text-[10px] text-neutral-500 leading-normal line-clamp-2 italic font-serif">Prompt: {scene.visualPrompt}</p>
        </div>
      </div>
    </div>
  );
};
