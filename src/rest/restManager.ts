import { Collection, DISCORDENO_VERSION, LogDepth, LogLevels, RestManager, createLogger, createRestManager } from '@discordeno/bot'
import { DISCORD_TOKEN } from '../config.js'
import { setupRestAnalyticsHooks } from './influx.js'

export const BOT_TOKENS = new Map<string, string>()

BOT_TOKENS.set('1238948797770502226', 'MTIzODk0ODc5Nzc3MDUwMjIyNg.GTs3eS.gWS2n7-Muwd30nfj3K2jWRabAaFwXv8DM6ezlA')
BOT_TOKENS.set('1337156292057366528', 'MTMzNzE1NjI5MjA1NzM2NjUyOA.G_zcFA.cLtC0LI9LPfcW7iJovnmJbOjBZrf6hgKnT2O0E')

const manager = createRestManager({
  token: DISCORD_TOKEN
})

manager.createBaseHeaders = () => {
  return {
    'user-agent': `DiscordBot (https://github.com/discordeno/discordeno, v${DISCORDENO_VERSION})`,
    bot_id: manager.applicationId.toString(),
  }
}

export const logger = createLogger({ name: 'REST' })
logger.setDepth(LogDepth.Full)

setupRestAnalyticsHooks(manager, logger)

export default manager
