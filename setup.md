1. Docker - Kafka and ClickHouse

```cd docker
docker compose up -d
```

2. Solana - Validator with Geyser Plugin

```
cd yellowstone-grpc
cargo build
solana-test-validator --geyser-plugin-config ./yellowstone-grpc-geyser/config.json
```

3. Grpc to Kafka

```
cd yellowstone-grpc-kafka
cargo build
cargo run --bin grpc-kafka -- --config config-kafka.json grpc2kafka
```

4. Kafka Testing - Consume messages

```
docker exec -it kafka bash
cd /opt/kafka/bin
./kafka-topics.sh --bootstrap-server localhost:9092 --create --topic grpc1
./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic grpc1
```

5. Backend - TypeScript

```
cd backend
npm install
npm run build
npm run start`
```
