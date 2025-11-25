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
  companyName: 'Physics Wallah AI',
  pageTitle: 'PW AI Coach',
  pageDescription:
    'Your personal AI tutor for mastering concepts. Learn, Quiz, and Teach-Back with the power of Alakh Sir\'s vision.',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/logo.svg',
  accent: '#D81F26', // PW Red
  logoDark: '/logo.svg',
  accentDark: '#D81F26', // PW Red
  startButtonText: 'Start Learning',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: undefined,
};
