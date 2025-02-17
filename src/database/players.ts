import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const playerSchema = new Schema({
  discord_id: { type: String, required: true, unique: true },
  steam_id: { type: String, required: false, unique: true, sparse: true },
  xbox_id: { type: String, required: false, unique: true, sparse: true },
  epic_id: { type: String, required: false, unique: true, sparse: true },
  psn_id: { type: String, required: false, unique: true, sparse: true },
  user_name: { type: String, required: true },
  display_name: { type: String, required: true },
});

export const Player = mongoose.model('Players', playerSchema);