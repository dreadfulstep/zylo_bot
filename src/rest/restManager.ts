import { Collection, DISCORDENO_VERSION, LogDepth, LogLevels, RestManager, createLogger, createRestManager } from '@discordeno/bot'
import { DISCORD_TOKEN } from '../config.js'
import { setupRestAnalyticsHooks } from './influx.js'
import { connectToDatabase } from './utils/db.js';

export const BOT_TOKENS = new Map<string, string>()

export async function fetchBotTokens(botId?: string) {
  const client = await connectToDatabase();

  let query = 'SELECT token, bot_id FROM bots';
  let queryParams: any[] = [];

  if (botId) {
    query = 'SELECT token, bot_id FROM bots WHERE bot_id = $1';
    queryParams = [botId];
  }

  try {
    const result = await client.query(query, queryParams);
    const bots = result.rows;

    if (botId) {
      if (bots.length === 1) {
        const bot = bots[0];
        BOT_TOKENS.set(bot.bot_id, bot.token);
        logger.info(`New bot inserted with ID ${botId}. Token added to map.`);
      } else {
        logger.warn(`Bot with ID ${botId} not found.`);
      }
    } else {
      bots.forEach((bot: { token: string; bot_id: string }) => {
        BOT_TOKENS.set(bot.bot_id, bot.token);
      });
      logger.info(`Loaded ${bots.length} bot tokens.`);
    }
  } catch (error) {
    logger.error('Error fetching bot tokens:', error);
  }
}

async function listenForNewBots() {
  const client = await connectToDatabase();

  client.query('LISTEN new_bot_inserted');

  client.on('notification', async (msg) => {
    if (msg.channel === 'new_bot_inserted') {
      const botId = msg.payload;
      logger.info(`Received notification: New bot inserted with ID ${botId}`);

      await fetchBotTokens(botId);
    }
  });

  logger.info('Listening for new bot insertions...');
}

async function initialize() {
  await fetchBotTokens();
  await listenForNewBots();
}

initialize().catch((err) => logger.error('Error during initialization: ', err));

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

async function addBotToDatabase(token: string, ownerId: string, botId: string) {
  const client = await connectToDatabase();

  const query = `
    INSERT INTO bots (bot_id, token, owner_id) 
    VALUES ($1, $2, $3) 
    ON CONFLICT (bot_id) DO NOTHING;
  `;

  try {
    await client.query(query, [botId, token, ownerId]);
    logger.info(`Bot (${botId}) with owner ID ${ownerId} added.`);
    
    await fetchBotTokens(botId);
  } catch (error) {
    logger.error('Error adding bot to database:', error);
  }
}