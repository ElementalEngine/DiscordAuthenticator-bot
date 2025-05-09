import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';

import { deploy } from './deploy'

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
})

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);
(client as  any).commands = new Collection()
const commandsPath = path.join(__dirname, '../commands')
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.ts'))
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = require(filePath)
    if ('data' in command && 'execute' in command) {
      (client as any).commands.set(command.data.name, command)
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      )
    }
}

const eventsPath = path.join(__dirname, '../events')
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith('.ts'))

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file)
  const event = require(filePath)
if (event.once) {
      client.once(event.name, (...args: any) => event.execute(...args))
    } else {
      client.on(event.name, (...args: any) => event.execute(...args))
    }
}

deploy()

export default client
