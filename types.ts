
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
