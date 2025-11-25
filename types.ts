export interface AnalysisResult {
  text: string;
  groundingMetadata?: {
    groundingChunks?: Array<{
      web?: { uri: string; title: string };
      maps?: { 
        uri: string; 
        title: string; 
        placeAnswerSources?: { reviewSnippets?: { sourceUri: string }[] }[] 
      };
    }>;
  };
}

export enum InputMode {
  UPLOAD = 'UPLOAD',
  YOUTUBE = 'YOUTUBE'
}

export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}
