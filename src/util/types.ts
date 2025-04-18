export interface DiscordProfile {
  id: string;
  username: string;
  global_name?: string;
  discriminator?: string;
  email?: string;
  verified: boolean;
  locale?: string;
  mfa_enabled: boolean;
  premium_type?: number;
  avatar?: string | null;
}

export interface SteamProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  communityvisibilitystate: number;
  profilestate: number;
  lastlogoff?: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: string;
}

export interface SteamConfig {
  apiKey: string;
  partnerApiKey: string;
  gameIdCiv6: number;
  playTimeCiv6: number;
  gameIdCiv7: number;
  playTimeCiv7: number;
}