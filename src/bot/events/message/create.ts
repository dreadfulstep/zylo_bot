import { logger } from "@discordeno/bot";
import { bot } from "../../bot.js";
import { updateCommands } from "../../utils/updateCommands.js";
import { getDirnameFromFileUrl } from "../../../util.js";
import importDirectory from "../../utils/loader.js";
import { join } from "node:path";

bot.events.messageCreate = async (message) => {
  if (message.content === '.refresh' && message.author.id.toString() === '881277706862481479') {
    
    try {
        const currentDirectory = getDirnameFromFileUrl(import.meta.url)
        
        await importDirectory(join(currentDirectory, '../../commands'))
        await updateCommands();
        bot.helpers.sendMessage(message.channelId, { content: "Commands have been refreshed!", messageReference: { messageId: message.id, failIfNotExists: false } });
    } catch (error) {
        bot.helpers.sendMessage(message.channelId, { content: "An error has occured trying to refresh commands.", messageReference: { messageId: message.id, failIfNotExists: false } });
        logger.error(error);
    }
  }
};
