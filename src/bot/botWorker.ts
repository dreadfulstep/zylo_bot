import { parentPort, workerData } from "worker_threads";
import { createBot, DISCORDENO_VERSION } from "@discordeno/bot";

const { botId, token, restUrl, auth } = workerData;

async function startBot() {
  const bot = createBot({
    token,
    rest: {
      token,
      proxy: {
        baseUrl: restUrl,
        authorization: auth,
      },
    },
  });

  bot.rest.createBaseHeaders = () => ({
    "user-agent": `DiscordBot (https://github.com/discordeno/discordeno, v${DISCORDENO_VERSION})`,
    bot_id: bot.rest.applicationId.toString(),
  });

  bot.events.ready = async () => {
    parentPort?.postMessage(`Bot ${botId} is ready.`);
  };

  bot.gateway.editBotStatus({ status: "online", activities: [{ name: `Bot ${botId}`, type: 0 }] });

  await bot.start();
}

startBot().catch((err) => parentPort?.postMessage(`Bot ${botId} failed: ${err.message}`));
