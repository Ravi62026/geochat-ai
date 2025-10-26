// Fix: Add a global type definition for 'process.env.API_KEY' to satisfy TypeScript,
// as required by the Gemini API guidelines for API key handling.
declare global {
  var process: {
    env: {
      API_KEY: string;
    };
  };
}

export interface SearchGroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface MapsGroundingChunk {
  maps: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        uri: string;
        text: string;
      }[];
    };
  };
}

export type GroundingChunk = SearchGroundingChunk | MapsGroundingChunk;

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingChunks?: GroundingChunk[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}
