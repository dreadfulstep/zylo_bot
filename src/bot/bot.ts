import { Collection, DISCORDENO_VERSION, LogDepth, LogLevels, createBot, type logger } from '@discordeno/bot'
import { DISCORD_TOKEN, GATEWAY_AUTHORIZATION, GATEWAY_INTENTS, GATEWAY_URL, REST_AUTHORIZATION, REST_URL } from '../config.js'
import type { ManagerGetShardInfoFromGuildId, ShardInfo, WorkerPresencesUpdate, WorkerShardPayload } from '../gateway/worker/types.js'
import type { Command } from './commands.js'

import './test.js';

const rawBot = createBot({
  token: DISCORD_TOKEN,
  intents: GATEWAY_INTENTS,
  // TEMPLATE-SETUP: Add/Remove the desired properties that you don't need
  desiredProperties: {
    user: {
      id: true,
      username: true,
      toggles: true,
    },
    message: {
      channelId: true,
      content: true,
      id: true,
      
      author: true,
      guildId: true,
    },
    interaction: {
      id: true,
      data: true,
      type: true,
      user: true,
      token: true,
      guildId: true,
    },
  },
  rest: {
    token: DISCORD_TOKEN,
    proxy: {
      baseUrl: REST_URL,
      authorization: REST_AUTHORIZATION,
    },
  },
})

export const bot = rawBot as CustomBot

bot.events.ready = (payload) => {
  bot.gateway.editShardStatus(payload.shardId, {
    status: 'online',
    activities: [
      {
        name: `On Shard ${payload.shardId} / ${bot.gateway.totalShards}`,
        type: 0,
      },
    ],
  })
}

;(bot.logger as typeof logger).setDepth(LogDepth.Full)

bot.commands = new Collection()

overrideGatewayImplementations(bot)

export type CustomBot = typeof rawBot & {
  commands: Collection<string, Command>
}

function overrideGatewayImplementations(bot: CustomBot): void {
  bot.gateway.sendPayload = async (shardId, payload) => {
    await fetch(GATEWAY_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'ShardPayload',
        shardId,
        payload,
      } satisfies WorkerShardPayload),
      headers: {
        'Content-Type': 'application/json',
        Authorization: GATEWAY_AUTHORIZATION,
      },
    })
  }

  bot.gateway.editBotStatus = async (payload) => {
    await fetch(GATEWAY_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'EditShardsPresence',
        payload,
      } satisfies WorkerPresencesUpdate),
      headers: {
        'Content-Type': 'application/json',
        Authorization: GATEWAY_AUTHORIZATION,
      },
    })
  }

  bot.rest.createBaseHeaders = () => {
    return {
      'user-agent': `DiscordBot (https://github.com/discordeno/discordeno, v${DISCORDENO_VERSION})`,
      bot_id: bot.rest.applicationId.toString(),
    }
  }
}

export async function getShardInfoFromGuild(guildId?: bigint): Promise<Omit<ShardInfo, 'nonce'>> {
  const req = await fetch(GATEWAY_URL, {
    method: 'POST',
    body: JSON.stringify({
      type: 'ShardInfoFromGuild',
      guildId: guildId?.toString(),
    } as ManagerGetShardInfoFromGuildId),
    headers: {
      'Content-Type': 'application/json',
      Authorization: GATEWAY_AUTHORIZATION,
    },
  })

  const res = await req.json()

  if (req.ok) return res

  throw new Error(`There was an issue getting the shard info: ${res.error}`)
}