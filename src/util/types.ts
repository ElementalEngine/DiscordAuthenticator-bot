export interface DiscordProfile {
  id: string;
  username: string;
  global_name?: string; 
  discriminator: string;
  email?: string;
  verified: boolean;
  locale?: string;
  mfa_enabled: boolean;
  premium_type?: number;
  avatar?: string | null;
}