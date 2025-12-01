export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  // for LiveKit Cloud Sandbox
  sandboxId?: string;
  agentName?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Improv Battle',
  pageTitle: 'Improv Battle - Voice Improv Game',
  pageDescription: 'A voice-first improv game show powered by AI',

  supportsChatInput: true,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/lk-logo.svg',
  accent: '#ff6b35',
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#ff8c5a',
  startButtonText: '🎭 Start Improv Battle',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: undefined,
};
