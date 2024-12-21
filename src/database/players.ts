import mongoose from 'mongoose'

const Schema = mongoose.Schema

const player = new Schema({
  discord_id: { type: String, required: true },
  epic_id: { type: String, required: false },
  steam_id: { type: String, required: false },
  user_name: { type: String, required: true },
  display_name: { type: String, required: true },
})

export const Player = mongoose.model('Players', player)