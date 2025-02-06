import { readdir } from 'node:fs/promises'
import { bot } from '../bot.js'
import { join } from 'node:path'
import { stat } from 'node:fs/promises'

export default async function importDirectory(folder: string): Promise<void> {
    const files = await readdir(folder)
    for (const filename of files) {
      const fullPath = join(folder, filename)
      if ((await stat(fullPath)).isDirectory()) {
        await importDirectory(fullPath)
      } else if (filename.endsWith('.js')) {
        await import(`file://${fullPath}`).then(() => {
          bot.logger.debug(`Imported file (${fullPath})`)
        }).catch((x) => bot.logger.fatal(`Cannot import file (${fullPath}) for reason:`, x))
      }
    }
}
