# Kafka Express Backend with Solana Protobuf Decoding & ClickHouse (TypeScript)

A TypeScript Express server that consumes Solana blockchain messages from Kafka topic `grpc1`, decodes them using protobuf, and writes them to both files and ClickHouse database with enhanced debugging capabilities.

## Features

- **TypeScript**: Full TypeScript implementation with proper type safety
- **ClickHouse Integration**: Stores all data in ClickHouse database at localhost:8123
- Consumes Solana blockchain messages from Kafka topic `grpc1` at `localhost:9092`
- Decodes Solana protobuf messages using protobufjs
- **Enhanced Debugging**: Hex byte logging for unknown protobuf structures
- Supports ConfirmedBlock, ConfirmedTransaction, and Transaction message types
- Falls back to JSON parsing if protobuf decoding fails
- Writes decoded messages to `kafka_messages.txt` with timestamps
- Writes raw messages to `raw_kafka_messages.txt` for debugging
- **Dual Storage**: Data stored in both files and ClickHouse for analysis
- Provides REST API endpoints to view and manage messages
- Graceful shutdown handling

## Prerequisites

1. **Kafka** running on `localhost:9092`
2. **ClickHouse** running on `localhost:8123`
3. Node.js and npm installed

## Setup

1. Install dependencies:

```bash
npm install
```

2. Make sure ClickHouse is running on `localhost:8123`

   - Default database: `default`
   - Default user: `default` (no password)

3. The `message.proto` file contains the Solana blockchain protobuf schema

4. Make sure Kafka is running on `localhost:9092` with topic `grpc1`

5. Development (TypeScript with hot reload):

```bash
npm run dev
# or with nodemon watch mode:
npm run dev:watch
```

6. Production (compile and run):

```bash
npm run build
npm start
```

## ClickHouse Tables

The server automatically creates three tables in ClickHouse:

### `kafka_raw_messages`

- `timestamp` - Message timestamp
- `topic` - Kafka topic name
- `partition` - Kafka partition
- `offset` - Message offset
- `message_hex` - Raw message in hex format
- `message_base64` - Raw message in base64 format
- `message_length` - Message size in bytes
- `hex_bytes` - Formatted hex bytes with spaces

### `kafka_decoded_messages`

- `timestamp` - Message timestamp
- `topic` - Kafka topic name
- `partition` - Kafka partition
- `offset` - Message offset
- `message_type` - Type of decoded message (ConfirmedBlock, JSON, Raw, etc.)
- `decoded_data` - JSON string of decoded data
- `is_protobuf` - Boolean indicating if successfully decoded as protobuf
- `decode_success` - Boolean indicating if decoding was successful

### `solana_transactions` (NEW!)

- `timestamp` - Message timestamp
- `topic` - Kafka topic name
- `partition` - Kafka partition
- `offset` - Message offset
- `block_hash` - Solana block hash
- `parent_slot` - Parent slot number
- `block_time` - Block timestamp
- `block_height` - Block height
- `transaction_signature` - Transaction signature (primary identifier)
- `transaction_index` - Index of transaction within the block
- `account_keys` - JSON array of account keys involved
- `recent_blockhash` - Recent blockhash used
- `instructions` - JSON array of transaction instructions
- `balances_before` - Account balances before transaction
- `balances_after` - Account balances after transaction
- `token_balances_before` - Token balances before transaction
- `token_balances_after` - Token balances after transaction
- `rewards` - Block rewards (if any)
- `fee` - Transaction fee in lamports
- `status` - Transaction execution status
- `compute_units_consumed` - Compute units used

## TypeScript Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run directly with ts-node
- `npm run dev:watch` - Run with nodemon for auto-restart
- `npm start` - Run compiled JavaScript
- `npm run clean` - Remove compiled files

## API Endpoints

### Core Endpoints

- `GET /` - Server status, configuration info, and protobuf loading status
- `GET /messages` - View both decoded and raw messages from files with counts
- `GET /messages/raw` - View only raw messages from files
- `DELETE /messages` - Clear both files and ClickHouse data

### ClickHouse Endpoints

- `GET /stats` - Get ClickHouse statistics (message counts, protobuf success rate, transaction counts)
- `GET /clickhouse/messages?limit=10` - Get recent messages from ClickHouse (default limit: 10)
- `GET /clickhouse/transactions?limit=10` - Get recent Solana transactions from ClickHouse (default limit: 10)
- `GET /clickhouse/transaction-stats` - Get detailed transaction statistics (fees, block counts, recent activity)

### Example ClickHouse Queries

```bash
# Get statistics including transaction counts
curl http://localhost:3000/stats

# Get last 5 messages
curl http://localhost:3000/clickhouse/messages?limit=5

# Get last 10 Solana transactions
curl http://localhost:3000/clickhouse/transactions?limit=10

# Get transaction statistics
curl http://localhost:3000/clickhouse/transaction-stats

# Clear all data (including transactions)
curl -X DELETE http://localhost:3000/messages
```

## Debugging Features

### Hex Byte Logging

When messages are received, the server logs:

- Raw hex bytes in console: `Raw message hex bytes: 0a 07 6d 73 67 2d 31 32 33...`
- Message length in bytes
- Formatted hex output in files and ClickHouse

This helps identify protobuf message patterns when the schema is unknown.

### Multiple Storage Formats

Each message is stored in multiple formats:

- **ClickHouse database** (structured, queryable)
- **Decoded protobuf** (if successful)
- **Raw hex** and **base64** encoding
- **Formatted hex bytes** with spaces
- **UTF-8 string** representation

## Solana Protobuf Schema

The server uses the Solana blockchain protobuf schema with the following main message types:

- `ConfirmedBlock` - Complete Solana block data with transactions and metadata
- `ConfirmedTransaction` - Individual transaction with execution metadata
- `Transaction` - Raw transaction data with signatures and instructions

The schema includes comprehensive Solana-specific structures like:

- Transaction signatures and instructions
- Account keys and balances
- Token balances and transfers
- Rewards and fees
- Block timestamps and heights

## Usage

1. The server will automatically start consuming messages from the `grpc1` topic
2. **ClickHouse tables are created automatically** on startup
3. Solana blockchain messages are decoded using protobuf and written to:
   - ClickHouse database (structured storage)
   - `backend/kafka_messages.txt` (human-readable)
   - `backend/raw_kafka_messages.txt` (debugging)
4. **Console output shows hex bytes** for debugging unknown structures
5. Check the console for connection status, decoding success, and message logs
6. Use the API endpoints to view or clear messages
7. **Query ClickHouse directly** for advanced analytics

## Message Processing Flow

1. **Raw Message Storage**: All incoming messages are first stored in raw format (hex and base64) for debugging
2. **Hex Logging**: Console displays formatted hex bytes for pattern recognition
3. **ClickHouse Storage**: Raw message data inserted into `kafka_raw_messages` table
4. **Solana Protobuf Decoding**: Attempts to decode using Solana message types in order:
   - ConfirmedBlock (most common for block data)
   - ConfirmedTransaction (for individual transactions)
   - Transaction (for raw transaction data)
5. **JSON Fallback**: If protobuf fails, tries to parse as JSON string
6. **Raw Fallback**: If all else fails, stores as raw string, hex, and base64
7. **ClickHouse Storage**: Decoded message data inserted into `kafka_decoded_messages` table
8. **File Storage**: Messages also written to text files for debugging
9. **Console Logging**: Successfully decoded protobuf messages are logged to console

## ClickHouse Query Examples

```sql
-- Get message count by type
SELECT message_type, COUNT(*) as count
FROM kafka_decoded_messages
GROUP BY message_type;

-- Get protobuf success rate
SELECT
  COUNT(*) as total_messages,
  SUM(is_protobuf) as protobuf_decoded,
  (SUM(is_protobuf) * 100.0 / COUNT(*)) as success_rate
FROM kafka_decoded_messages;

-- Get recent failed decodings
SELECT timestamp, message_type, hex_bytes
FROM kafka_raw_messages r
JOIN kafka_decoded_messages d ON r.offset = d.offset
WHERE d.decode_success = false
ORDER BY timestamp DESC
LIMIT 10;

-- Get largest messages
SELECT timestamp, message_length, message_type
FROM kafka_raw_messages r
JOIN kafka_decoded_messages d ON r.offset = d.offset
ORDER BY message_length DESC
LIMIT 10;

-- SOLANA TRANSACTION QUERIES --

-- Get transaction count by block
SELECT block_hash, COUNT(*) as transaction_count
FROM solana_transactions
GROUP BY block_hash
ORDER BY transaction_count DESC
LIMIT 10;

-- Get highest fee transactions
SELECT
  transaction_signature,
  block_hash,
  toFloat64(fee) as fee_lamports,
  timestamp
FROM solana_transactions
WHERE fee != ''
ORDER BY toFloat64(fee) DESC
LIMIT 10;

-- Get transactions by account involvement
SELECT
  transaction_signature,
  block_hash,
  account_keys,
  toFloat64(fee) as fee
FROM solana_transactions
WHERE account_keys LIKE '%YOUR_ACCOUNT_ADDRESS%'
ORDER BY timestamp DESC
LIMIT 10;

-- Get daily transaction volume
SELECT
  toDate(timestamp) as date,
  COUNT(*) as transaction_count,
  SUM(toFloat64(fee)) as total_fees
FROM solana_transactions
WHERE fee != ''
GROUP BY toDate(timestamp)
ORDER BY date DESC
LIMIT 30;

-- Get compute unit usage statistics
SELECT
  AVG(toFloat64(compute_units_consumed)) as avg_compute_units,
  MAX(toFloat64(compute_units_consumed)) as max_compute_units,
  MIN(toFloat64(compute_units_consumed)) as min_compute_units
FROM solana_transactions
WHERE compute_units_consumed != '';

-- Get failed transactions
SELECT
  transaction_signature,
  block_hash,
  status,
  timestamp
FROM solana_transactions
WHERE status LIKE '%"Err"%'
ORDER BY timestamp DESC
LIMIT 10;
```

## Troubleshooting

- Ensure **ClickHouse is running** on `localhost:8123`
- Ensure **Kafka is running** on `localhost:9092`
- Check that the topic `grpc1` exists and contains Solana blockchain data
- Check console logs for ClickHouse connection errors
- Check console logs for protobuf loading and decoding errors
- **Use hex byte output** to identify protobuf message patterns
- Use the `/messages/raw` endpoint to inspect raw message data
- Use the `/stats` endpoint to monitor ClickHouse data
- The server tries multiple Solana message types automatically
- Successfully decoded messages will show rich Solana blockchain data including transactions, balances, and metadata
- For TypeScript compilation errors, run `npm run clean` and `npm run build`
- **Query ClickHouse directly** for advanced debugging and analytics
