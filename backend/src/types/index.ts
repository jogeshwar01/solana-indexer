export interface DecodedMessage {
  type: string;
  data: any;
}

export interface MessageData {
  topic: string;
  partition: number;
  offset: string;
  value: Buffer | null;
}

export interface ClickHouseBlock {
  timestamp: string;
  topic: string;
  partition: number;
  offset: string;
  message_type: string;
  decoded_data: string;
  is_protobuf: boolean;
  decode_success: boolean;
}
