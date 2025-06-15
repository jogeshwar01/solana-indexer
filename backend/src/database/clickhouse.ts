import { createClient, ClickHouseClient } from "@clickhouse/client";
import { ClickHouseBlock } from "../types";

// ClickHouse configuration
export const clickhouse: ClickHouseClient = createClient({
  host: "http://localhost:8123",
  database: "default",
  username: "default",
  password: "",
});

// Initialize ClickHouse table
export const initializeClickHouseTable = async (): Promise<void> => {
  try {
    // Create blocks table
    await clickhouse.exec({
      query: `
        CREATE TABLE IF NOT EXISTS blocks (
          timestamp DateTime64(3),
          topic String,
          partition UInt32,
          offset String,
          message_type String,
          decoded_data String,
          is_protobuf Bool,
          decode_success Bool
        ) ENGINE = MergeTree()
        ORDER BY (timestamp, topic, partition, offset)
      `,
    });

    console.log("ClickHouse blocks table initialized successfully");
  } catch (error) {
    console.error("Error initializing ClickHouse table:", error);
  }
};

// Function to write block to ClickHouse
export const writeBlockToClickHouse = async (
  block: ClickHouseBlock
): Promise<void> => {
  try {
    await clickhouse.insert({
      table: "blocks",
      values: [block],
      format: "JSONEachRow",
    });

    console.log("Block data written to ClickHouse successfully");
  } catch (error) {
    console.error("Error writing to ClickHouse:", error);
  }
};

// Function to clear blocks table
export const clearBlocksTable = async (): Promise<void> => {
  try {
    await clickhouse.exec({
      query: "TRUNCATE TABLE blocks",
    });
    console.log("ClickHouse blocks table cleared");
  } catch (error) {
    console.error("Error clearing ClickHouse blocks table:", error);
  }
};

// Function to close ClickHouse connection
export const closeClickHouse = async (): Promise<void> => {
  await clickhouse.close();
  console.log("ClickHouse client closed");
};
