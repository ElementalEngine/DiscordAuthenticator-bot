import type { DiscordProfile } from '../util/types.js';

declare global {
  namespace Express {
    interface Request {
      discord?: DiscordProfile;
      steamid?: string;
    }
  }
}