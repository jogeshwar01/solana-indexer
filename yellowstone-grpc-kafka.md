git switch 1.18

remove this from config-kafka.json

```
"blocks": {
    "client": {
        "account_include": [],
        "include_transactions": false,
        "include_accounts": false,
        "include_entries": false
    }
}
```

update url to localhost:9092 in config-kafka.json (depends on your setup)

cargo run --bin grpc-kafka -- --config config-kafka.json grpc2kafka