// Chat message type
export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: number;
  sender?: string;
}

// Screen states
export type ScreenType = 'screen1' | 'screen2' | 'screen3' | 'screen4';

// Unity instance type
export interface UnityInstance {
  SendMessage(objectName: string, methodName: string, value?: string | number): void;
  SetFullscreen(fullscreen: number): void;
  Quit(): Promise<void>;
}

// LiveKit metadata
export interface ClientMetadata {
  userLanguage: string;
  agentLanguage: string;
  customPersona: string;
  voiceName: string;
}

// Token request/response
export interface TokenRequest {
  room: string;
  identity: string;
  livekitUrl: string;
  metadata?: ClientMetadata;
}

export interface TokenResponse {
  token: string;
}
