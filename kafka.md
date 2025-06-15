docker exec -it kafka bash

cd /opt/kafka/bin

./kafka-topics.sh --bootstrap-server localhost:9092 --create --topic grpc1

./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic grpc1
