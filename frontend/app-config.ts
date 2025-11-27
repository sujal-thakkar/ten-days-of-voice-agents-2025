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
  companyName: 'Bank of Baroda',
  pageTitle: 'BoB Fraud Alert Voice Agent',
  pageDescription: "Speak with Bank of Baroda's AI-powered fraud detection assistant.",

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/bob-logo.png',
  accent: '#F15A24', // BoB signature orange
  logoDark: '/bob.png',
  accentDark: '#FF7A45', // lighter orange for dark mode
  startButtonText: 'Verify Transaction',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: undefined,
};
