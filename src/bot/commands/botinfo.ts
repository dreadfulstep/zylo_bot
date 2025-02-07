import { bot, getShardInfoFromGuild } from '../bot.js'
import createCommand from '../commands.js'
import { readFileSync } from 'node:fs';

createCommand({
  name: 'botinfo',
  description: 'Display bot statistics and info.',
  async run(interaction) {
    const shardCount = bot.gateway.totalShards;
    const shardInfo = await getShardInfoFromGuild(interaction.guildId)
    const shardPing = shardInfo.rtt === -1 ? '*Not yet available*' : `${shardInfo.rtt}ms`;

    const workerCount = bot.gateway.totalWorkers;
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024 
    const memoryUsageFormatted = memoryUsage.toFixed(2)

    const uptime = process.uptime()
    const uptimeFormatted = new Date(uptime * 1000).toISOString().substr(11, 8)

    const embed = {
      title: 'Bot Information',
      description: `Here are the current stats for <@${bot.id}>`,
      fields: [
        { name: 'Shard Count', value: `${shardCount}`, inline: true },
        { name: 'Shard Ping', value: `${shardPing}`, inline: true },
        { name: 'Worker Count', value: `${workerCount}`, inline: true },
        { name: 'Memory Usage', value: `${memoryUsageFormatted} MB`, inline: true },
        { name: 'Uptime', value: `${uptimeFormatted}`, inline: true },
      ],
      image: { url: 'attachment://banner.png' },
    }

    const bannerBuffer = readFileSync('/usr/src/app/assets/Banner.png')
    const bannerBlob = new Blob([bannerBuffer]);

    await interaction.respond({
      embeds: [embed],
      files: [
        {
          blob: bannerBlob,
          name: 'banner.png',
        }
      ],
    })
  },
})
