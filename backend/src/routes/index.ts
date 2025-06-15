import express, { Request, Response } from "express";
import { clickhouse, clearBlocksTable } from "../database/clickhouse";
import { isProtobufLoaded } from "../protobuf/decoder";

const router = express.Router();

// Root endpoint
router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Kafka-ClickHouse Indexer",
    topic: "grpc1",
    broker: "localhost:9092",
    clickhouse: "localhost:8123",
    table: "blocks",
    protobufLoaded: isProtobufLoaded(),
    language: "TypeScript",
  });
});

// Route to get ClickHouse table stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const totalCount = await clickhouse.query({
      query: "SELECT COUNT(*) as count FROM blocks",
      format: "JSONEachRow",
    });

    const protobufCount = await clickhouse.query({
      query: "SELECT COUNT(*) as count FROM blocks WHERE is_protobuf = true",
      format: "JSONEachRow",
    });

    const successCount = await clickhouse.query({
      query: "SELECT COUNT(*) as count FROM blocks WHERE decode_success = true",
      format: "JSONEachRow",
    });

    const totalResult = (await totalCount.json()) as Array<{ count: number }>;
    const protobufResult = (await protobufCount.json()) as Array<{
      count: number;
    }>;
    const successResult = (await successCount.json()) as Array<{
      count: number;
    }>;

    res.json({
      stats: {
        total_blocks: totalResult[0]?.count || 0,
        protobuf_decoded: protobufResult[0]?.count || 0,
        decode_success: successResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error getting ClickHouse stats:", error);
    res.status(500).json({ error: "Error getting database statistics" });
  }
});

// Route to get recent blocks from ClickHouse
router.get("/blocks", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await clickhouse.query({
      query: `
        SELECT 
          timestamp,
          topic,
          partition,
          offset,
          message_type,
          is_protobuf,
          decode_success,
          decoded_data
        FROM blocks 
        ORDER BY timestamp DESC 
        LIMIT ${limit}
      `,
      format: "JSONEachRow",
    });

    const blocks = await result.json();
    res.json({
      blocks,
      count: blocks.length,
    });
  } catch (error) {
    console.error("Error querying ClickHouse blocks:", error);
    res.status(500).json({ error: "Error querying blocks" });
  }
});

// Route to clear blocks table
router.delete("/blocks", async (req: Request, res: Response) => {
  try {
    await clearBlocksTable();
    res.json({ message: "Blocks table cleared successfully" });
  } catch (error) {
    console.error("Error clearing blocks table:", error);
    res.status(500).json({ error: "Error clearing blocks table" });
  }
});

export default router;
