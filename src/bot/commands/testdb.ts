import { logger } from '@discordeno/bot';
import createCommand from '../commands.js';
import { connectToDatabase } from '../utils/db.js';

createCommand({
  name: 'testdb',
  description: 'Test command to interact with the database',
  async run(interaction) {
    try {
      const client = await connectToDatabase();

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          age INT NOT NULL
        );
      `;
      await client.query(createTableQuery);

      const insertQuery = `INSERT INTO users (username, age) VALUES ($1, $2) RETURNING *`;
      const values = ['TestUser', 25];
      const result = await client.query(insertQuery, values);

      const selectQuery = 'SELECT * FROM users WHERE username = $1';
      const user = await client.query(selectQuery, ['TestUser']);

      const embed = {
        title: 'Database Test Result',
        description: `Here is the information for the user **TestUser**:`,
        fields: [
          { name: 'Inserted Record', value: `Username: ${result.rows[0].username}, Age: ${result.rows[0].age}`, inline: true },
          { name: 'Queried Record', value: `Username: ${user.rows[0].username}, Age: ${user.rows[0].age}`, inline: true },
        ],
      };

      await interaction.respond({ embeds: [embed] });

      await client.end();

    } catch (error) {
      logger.error(`Error in database interaction: ${error}`);
      await interaction.respond({
        content: 'There was an error interacting with the database.',
      });
    }
  },
});
