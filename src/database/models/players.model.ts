import mongoose, { Schema, Document } from 'mongoose';

// TypeScript interface for a Player document
export interface IPlayer extends Document {
  discord_id:   string;
  steam_id?:    string;
  xbox_id?:     string;
  epic_id?:     string;
  psn_id?:      string;
  user_name:    string;
  display_name: string;
}

// Define your schema 
const playerSchema = new Schema<IPlayer>(
  {
    discord_id:   { type: String, required: true, unique: true },
    steam_id:     { type: String, sparse: true, unique: true },
    xbox_id:      { type: String, sparse: true, unique: true },
    epic_id:      { type: String, sparse: true, unique: true },
    psn_id:       { type: String, sparse: true, unique: true },
    user_name:    { type: String, required: true },
    display_name: { type: String, required: true },
  },
  { timestamps: true }
);

// Export the model, explicitly binding it to the 'players' collection:
export const Player = mongoose.model<IPlayer>(
  'Player',        
  playerSchema,
  'players'        
);
