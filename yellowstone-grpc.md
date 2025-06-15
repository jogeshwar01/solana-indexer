git switch 1.18 // to support solana-test-validator else need to use agave

sudo apt update

sudo apt install libsasl2-dev

remove this from config.json

```
"tls_config": {
  "cert_path": "",
  "key_path": ""
}
```

cargo build

solana-test-validator --geyser-plugin-config ./yellowstone-grpc-geyser/config.json
