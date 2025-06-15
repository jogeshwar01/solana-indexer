import express from "express";
import {
  initializeClickHouseTable,
  closeClickHouse,
} from "./database/clickhouse";
import { loadProtobufSchema } from "./protobuf/decoder";
import { runConsumer, disconnectConsumer } from "./kafka/consumer";
import { processMessage } from "./services/message-processor";
import routes from "./routes";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(express.json());

// Use routes
app.use("/", routes);

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  console.log("Shutting down gracefully...");
  try {
    await disconnectConsumer();
    await closeClickHouse();
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start server and Kafka consumer
app.listen(PORT, async () => {
  console.log(`Kafka-ClickHouse Indexer running on port ${PORT}`);
  console.log(`ClickHouse database: localhost:8123`);

  // Initialize ClickHouse table
  await initializeClickHouseTable();

  // Load protobuf schema
  await loadProtobufSchema();

  // Start Kafka consumer with message processor
  runConsumer(processMessage).catch(console.error);
});
