
import React from 'react';
import { Scene, ImageSize } from '../types';

interface AssetCardProps {
  scene: Scene;
  onGenerate: (id: string, size: ImageSize) => void;
  selectedSize: ImageSize;
}

export const AssetCard: React.FC<AssetCardProps> = ({ scene, onGenerate, selectedSize }) => {
  return (
    <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 transition-all hover:border-white/20 group">
      <div className="aspect-[9/16] bg-neutral-900 relative overflow-hidden flex items-center justify-center">
        {scene.imageUrl ? (
          <img 
            src={scene.imageUrl} 
            alt={scene.text} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            {scene.isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-neutral-400">Dreaming up your visuals...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-500 group-hover:text-red-500 transition-colors">
                  <i className="fa-solid fa-image text-2xl"></i>
                </div>
                <button
                  onClick={() => onGenerate(scene.id, selectedSize)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full text-sm transition-all"
                >
                  Generate {selectedSize} Image
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">Script Line</h4>
        <p className="text-sm text-neutral-200 line-clamp-2 italic">"{scene.text}"</p>
        <div className="pt-2 border-t border-white/5">
           <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Visual Prompt</h4>
           <p className="text-xs text-neutral-400 line-clamp-3">{scene.visualPrompt}</p>
        </div>
      </div>
    </div>
  );
};
