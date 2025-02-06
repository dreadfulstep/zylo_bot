import { createBot, DISCORDENO_VERSION } from "@discordeno/bot";
import { REST_AUTHORIZATION, REST_URL } from "../config.js";

const botTokens = ["", ""];

botTokens.forEach(async (token, index) => {
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
        }
    }

    bot.events.ready = async () => {
        bot.helpers.sendMessage("1332773747400245372", { content: `Hello, world from bot ${index + 1}!` });
    };

    await bot.start();
});