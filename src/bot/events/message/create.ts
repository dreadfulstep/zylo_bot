import { bot } from "../../bot.js";

bot.events.messageCreate = async (message) => {
    console.log(message.author)
}