import { Worker } from "worker_threads";
import { REST_AUTHORIZATION, REST_URL } from "../config.js";
import { BOT_TOKENS, fetchBotTokens } from "../rest/restManager.js";
import { connectToDatabase } from "./utils/db.js";
import { logger } from "@discordeno/bot";
import mainBot from "./mainBot.js";

const botWorkers = new Map<string, Worker>();

async function initializeBot(botId: string, token: string) {
  if (botWorkers.has(botId)) {
    logger.warn(`Bot ${botId} is already running.`);
    return;
  }

  const worker = new Worker(new URL("./botWorker.js", import.meta.url), {
    workerData: { botId, token, restUrl: REST_URL, auth: REST_AUTHORIZATION },
  });

  worker.on("message", (msg) => logger.info(`[Bot ${botId}] ${msg}`));
  worker.on("error", (err) => logger.error(`[Bot ${botId}] Worker Error:`, err));
  worker.on("exit", (code) => {
    logger.warn(`Bot ${botId} exited with code ${code}`);
    botWorkers.delete(botId);
  });

  botWorkers.set(botId, worker);
  logger.info(`Bot ${botId} initialized in a worker thread.`);
}

async function initializeAllBots() {
  await fetchBotTokens();
  const tokensArray = Array.from(BOT_TOKENS.entries());

  logger.info(`Initializing ${tokensArray.length} bots...`);
  for (const [botId, token] of tokensArray) {
    await initializeBot(botId, token);
  }
}

async function listenForNewBots() {
  const client = await connectToDatabase();
  client.query("LISTEN new_bot_inserted");

  client.on("notification", async (msg) => {
    if (msg.channel === "new_bot_inserted") {
      const botId = msg.payload;
      logger.info(`Received notification: New bot inserted with ID ${botId}`);

      await fetchBotTokens(botId);
      const newBotToken = botId ? BOT_TOKENS.get(botId) : undefined;
      if (newBotToken) {
        await initializeBot(botId as string, newBotToken);
      }
    }
  });

  logger.info("Listening for new bot insertions...");
}

/**
 * Retrieves the bot client.
 * @param botId - The ID of the bot. If undefined, returns the main bot.
 */
export async function getClient(botId?: string) {
  if (!botId) {
    return mainBot();
  }
  if (!botWorkers.has(botId)) {
    throw new Error(`Bot ${botId} is not running.`);
  }
  
  const worker = botWorkers.get(botId);
  if (!worker) {
    throw new Error(`Worker for bot ${botId} is undefined.`);
  }
}

initializeAllBots()
  .then(() => listenForNewBots())
  .catch((err) => logger.error("Error initializing bots:", err));
