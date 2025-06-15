import * as protobuf from "protobufjs";
import * as path from "path";
import { DecodedMessage } from "../types";

// Protobuf types
let ConfirmedBlockType: protobuf.Type | null = null;
let ConfirmedTransactionType: protobuf.Type | null = null;
let TransactionType: protobuf.Type | null = null;

// Load protobuf schema
export const loadProtobufSchema = async (): Promise<void> => {
  try {
    const root = await protobuf.load(
      path.join(__dirname, "../../message.proto")
    );
    ConfirmedBlockType = root.lookupType(
      "solana.storage.ConfirmedBlock.ConfirmedBlock"
    );
    ConfirmedTransactionType = root.lookupType(
      "solana.storage.ConfirmedBlock.ConfirmedTransaction"
    );
    TransactionType = root.lookupType(
      "solana.storage.ConfirmedBlock.Transaction"
    );
    console.log("Solana protobuf schema loaded successfully");
    console.log(
      "Available message types: ConfirmedBlock, ConfirmedTransaction, Transaction"
    );
  } catch (error) {
    console.error("Error loading protobuf schema:", error);
    console.log("Will attempt to decode messages as raw data");
  }
};

// Function to decode protobuf message
export const decodeProtobufMessage = (
  buffer: Buffer
): DecodedMessage | null => {
  if (!ConfirmedBlockType && !ConfirmedTransactionType && !TransactionType) {
    return null;
  }

  // Try to decode with ConfirmedBlock first (most likely for block data)
  try {
    if (ConfirmedBlockType) {
      const decoded = ConfirmedBlockType.decode(buffer);
      return {
        type: "ConfirmedBlock",
        data: ConfirmedBlockType.toObject(decoded, {
          longs: String,
          enums: String,
          bytes: String,
          defaults: true,
          arrays: true,
          objects: true,
        }),
      };
    }
  } catch (error) {
    // If ConfirmedBlock fails, try ConfirmedTransaction
    try {
      if (ConfirmedTransactionType) {
        const decoded = ConfirmedTransactionType.decode(buffer);
        return {
          type: "ConfirmedTransaction",
          data: ConfirmedTransactionType.toObject(decoded, {
            longs: String,
            enums: String,
            bytes: String,
            defaults: true,
            arrays: true,
            objects: true,
          }),
        };
      }
    } catch (error2) {
      // If ConfirmedTransaction fails, try Transaction
      try {
        if (TransactionType) {
          const decoded = TransactionType.decode(buffer);
          return {
            type: "Transaction",
            data: TransactionType.toObject(decoded, {
              longs: String,
              enums: String,
              bytes: String,
              defaults: true,
              arrays: true,
              objects: true,
            }),
          };
        }
      } catch (error3) {
        console.log("Failed to decode with all Solana message types");
      }
    }
  }

  return null;
};

// Check if protobuf is loaded
export const isProtobufLoaded = (): boolean => {
  return (
    ConfirmedBlockType !== null ||
    ConfirmedTransactionType !== null ||
    TransactionType !== null
  );
};
