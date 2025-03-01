import assert from 'node:assert'
import { DEVELOPMENT, DEV_SERVER_ID } from '../../config.js'
import { getClient } from '../bot.js';

const bot = await getClient();

if (!bot) {
  console.error("Bot instance is unavailable. Exiting...");
  process.exit(0);
}

export async function updateCommands(): Promise<void> {
  bot!.logger.info('Updating commands')

  const userCommands = bot!.commands.filter((x) => !x.devOnly).array()
  await bot!.helpers.upsertGlobalApplicationCommands(userCommands)

  if (DEVELOPMENT) {
    assert(DEV_SERVER_ID, 'The DEV_SERVER_ID environment is missing')

    bot!.logger.info('Updating developer commands')

    const devCommands = bot!.commands.filter((x) => x.devOnly ?? false).array()
    await bot!.helpers.upsertGuildApplicationCommands(DEV_SERVER_ID, devCommands)
  }
}
