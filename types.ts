
export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K'
}

export interface Scene {
  id: string;
  text: string;
  visualPrompt: string;
  imageUrl?: string;
  videoUrl?: string;
  isGenerating?: boolean;
  isVideoGenerating?: boolean;
}

export interface AutomationPackage {
  id: string;
  timestamp: number;
  script: string;
  voiceOver: string;
  scenes: Scene[];
  subtitles: string;
  musicStyle: string;
  youtubeTitle: string;
  youtubeDescription: string;
  tags: string[];
  hashtags: string[];
  thumbnailText: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
