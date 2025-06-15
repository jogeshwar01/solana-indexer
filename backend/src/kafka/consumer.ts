import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { MessageData } from "../types";

// Kafka configuration
const kafka = new Kafka({
  clientId: "express-kafka-consumer",
  brokers: ["localhost:9092"],
});

export const consumer: Consumer = kafka.consumer({
  groupId: "express-consumer-group",
});

// Kafka consumer setup
export const runConsumer = async (
  messageHandler: (message: MessageData) => Promise<void>
): Promise<void> => {
  try {
    await consumer.connect();
    console.log("Connected to Kafka");

    await consumer.subscribe({ topic: "grpc1", fromBeginning: false });
    console.log("Subscribed to topic: grpc1");

    await consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        console.log(
          `Received message from ${topic}[${partition}]@${message.offset}`
        );

        // Process message using the provided handler
        await messageHandler({
          topic,
          partition,
          offset: message.offset.toString(),
          value: message.value,
        });
      },
    });
  } catch (error) {
    console.error("Error setting up Kafka consumer:", error);
  }
};

// Function to disconnect Kafka consumer
export const disconnectConsumer = async (): Promise<void> => {
  await consumer.disconnect();
  console.log("Kafka consumer disconnected");
};
