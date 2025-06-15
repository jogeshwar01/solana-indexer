import { MessageData, DecodedMessage, ClickHouseBlock } from "../types";
import { formatTimestampForClickHouse } from "../utils/timestamp";
import { decodeProtobufMessage } from "../protobuf/decoder";
import { writeBlockToClickHouse } from "../database/clickhouse";

// Function to process message and write to ClickHouse
export const processMessage = async (message: MessageData): Promise<void> => {
  const timestamp: string = new Date().toISOString();

  let decodedData: DecodedMessage | null = null;
  let isProtobuf: boolean = false;
  let decodeSuccess: boolean = false;

  if (message.value) {
    // Log hex bytes for debugging unknown protobuf structures
    console.log(
      "Raw message hex bytes:",
      [...message.value].map((b) => b.toString(16).padStart(2, "0")).join(" ")
    );
    console.log("Raw message length:", message.value.length, "bytes");

    // Try to decode as protobuf
    decodedData = decodeProtobufMessage(message.value);

    if (decodedData) {
      isProtobuf = true;
      decodeSuccess = true;
      console.log(`Decoded protobuf message type: ${decodedData.type}`);
    } else {
      // If protobuf decoding fails, try as JSON string
      try {
        const jsonString: string = message.value.toString("utf8");
        const jsonData = JSON.parse(jsonString);
        decodedData = { type: "JSON", data: jsonData };
        decodeSuccess = true;
        console.log("Decoded as JSON message");
      } catch (jsonError) {
        // If JSON parsing fails, store as raw data
        decodedData = {
          type: "Raw",
          data: {
            string: message.value.toString("utf8"),
            hex: message.value.toString("hex"),
            base64: message.value.toString("base64"),
          },
        };
        console.log("Stored as raw message data");
      }
    }
  } else {
    decodedData = { type: "Null", data: null };
    console.log("Received null message");
  }

  // Prepare block data for ClickHouse
  const blockData: ClickHouseBlock = {
    timestamp: formatTimestampForClickHouse(timestamp),
    topic: message.topic,
    partition: message.partition,
    offset: message.offset,
    message_type: decodedData?.type || "Unknown",
    decoded_data: JSON.stringify(decodedData?.data || {}),
    is_protobuf: isProtobuf,
    decode_success: decodeSuccess,
  };

  // Write to ClickHouse
  await writeBlockToClickHouse(blockData);

  console.log(
    `Message processed and stored in ClickHouse. Type: ${blockData.message_type}, Protobuf: ${isProtobuf}`
  );
};
