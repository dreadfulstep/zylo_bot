CREATE TABLE IF NOT EXISTS bots (
    bot_id TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    owner_id TEXT NOT NULL
);

CREATE OR REPLACE FUNCTION notify_new_bot_insert() 
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('new_bot_inserted', NEW.bot_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_bot_inserted_trigger
AFTER INSERT ON bots
FOR EACH ROW EXECUTE FUNCTION notify_new_bot_insert();