import { createBot, DISCORDENO_VERSION, logger } from "@discordeno/bot";
import { REST_AUTHORIZATION, REST_URL } from "../config.js";
import { BOT_TOKENS, fetchBotTokens } from "../rest/restManager.js";
import { connectToDatabase } from "./utils/db.js";

async function initializeBot(token: string, index: number) {
  const bot = createBot({
    token: token,
    rest: {
      token: token,
      proxy: {
        baseUrl: REST_URL,
        authorization: REST_AUTHORIZATION,
      },
    },
  });

  bot.rest.createBaseHeaders = () => {
    return {
      'user-agent': `DiscordBot (https://github.com/discordeno/discordeno, v${DISCORDENO_VERSION})`,
      bot_id: bot.rest.applicationId.toString(),
    };
  };

  bot.events.ready = async () => {
    bot.helpers.sendMessage("1332773747400245372", { content: `Hello, world from bot ${index + 1}!` });
  };

  bot.gateway.editBotStatus({ status: "online", activities: [{ name: `Bot ${index + 1}`, type: 0 }] });

  await bot.start();
  logger.info(`Bot ${index + 1} started successfully.`);
}

async function initializeAllBots() {
  await fetchBotTokens();

  const tokensArray = Array.from(BOT_TOKENS.entries());
  logger.info(`Initializing ${tokensArray.length} bots...`);

  tokensArray.forEach(([botId, token], index) => {
    initializeBot(token, index);
  });
}

async function listenForNewBots() {
  const client = await connectToDatabase();

  client.query('LISTEN new_bot_inserted');

  client.on('notification', async (msg) => {
    if (msg.channel === 'new_bot_inserted') {
      const botId = msg.payload;
      logger.info(`Received notification: New bot inserted with ID ${botId}`);

      await fetchBotTokens(botId);

      const newBotToken = BOT_TOKENS.get(botId as string);
      if (newBotToken) {
        initializeBot(newBotToken, BOT_TOKENS.size - 1);
      }
    }
  });

  logger.info('Listening for new bot insertions...');
}

initializeAllBots().then(() => {
  listenForNewBots().catch(err => logger.error('Error listening for new bots:', err));
}).catch(err => logger.error('Error initializing bots:', err));
