
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
  isGenerating?: boolean;
}

export interface AutomationPackage {
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
