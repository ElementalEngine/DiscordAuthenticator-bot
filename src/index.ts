import mongoose from 'mongoose'
import { config } from './config/index.js'
import discordClient from './discord/client.js'
import app from './server.js'

discordClient.login(config.discord.token)

mongoose
  .connect(config.mongoDb)
  .then(() => console.log('Connected to Database'))
  .catch(err => { throw err })

app.listen(
  config.port,
  ['127.0.0.1', 'localhost'].includes(config.host) ? config.host : '0.0.0.0',
  () => {
    console.log(`Server running at http://${config.host}:${config.port}/`)
  }
)
