import { logger } from "@discordeno/bot";
import pg from 'pg';

const { Client } = pg;

let cachedClient: InstanceType<typeof Client> | null = null;

export const connectToDatabase = async (retries = 5, delay = 5000) => {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
  });

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await client.connect();
      logger.info("Connected to PostgreSQL");
      cachedClient = client; 
      return client;
    } catch (error) {
      logger.error(`PostgreSQL connection attempt ${attempt + 1} failed. Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Failed to connect to PostgreSQL after multiple attempts.");
};

export const disconnectDatabase = async () => {
  if (cachedClient) {
    await cachedClient.end();
    logger.info("Disconnected from PostgreSQL");
    cachedClient = null;
  }
};
