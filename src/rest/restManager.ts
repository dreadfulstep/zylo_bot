import { Collection, DISCORDENO_VERSION, LogDepth, RestManager, createLogger, createRestManager } from '@discordeno/bot'
import { DISCORD_TOKEN } from '../config.js'
import { setupRestAnalyticsHooks } from './influx.js'

export const MANAGERS = new Collection<string, RestManager>()

export const BOT_TOKENS = new Map<string, string>()

BOT_TOKENS.set('bot_id_1', 'your_bot_token_1')
BOT_TOKENS.set('bot_id_2', 'your_bot_token_2')

const manager = createRestManager({
  token: DISCORD_TOKEN,
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
