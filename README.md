# Chainlink External Adapter for CryptoCompare VWAP

This external adapter calculates the market weighted average for a given coin, converting all non-USD markets to USD in order to return a VWAP.

## Input Params

- `coin`: The symbol of the asset to query

## Environment variables

| Variable      |               | Description | Example |
|---------------|:-------------:|------------- |:---------:|
| `APIKEY`  | **Required**  | Your CryptoCompare API Key | `ABCDEFGHJIKLMo64FtaRLRR5BdHEESmha49TM` |


## Install

```bash
npm install
```

## Test

```bash
npm test
```

## Create the zip

```bash
zip -r cl-cryptocompare-vwap.zip .
```

## Install to AWS Lambda

- In Lambda Functions, create function
- On the Create function page:
  - Give the function a name
  - Use Node.js 8.10 for the runtime
  - Choose an existing role or create a new one
  - Click Create Function
- Under Function code, select "Upload a .zip file" from the Code entry type drop-down
- Click Upload and select the `cl-cryptocompare-vwap.zip` file
- Handler should remain index.handler
- Add the environment variable (repeat for all environment variables):
  - Key: API_KEY
  - Value: Your_API_key
- Save


## Install to GCP

- In Functions, create a new function, choose to ZIP upload
- Click Browse and select the `cl-cryptocompare-vwap.zip` file
- Select a Storage Bucket to keep the zip in
- Function to execute: gcpservice
- Click More, Add variable (repeat for all environment variables)
  - NAME: API_KEY
  - VALUE: Your_API_key


## Run with Docker

```bash
docker build . -t cryptocompare-vwap-adapter
docker run -d \
    -p 8080:8080 \
    -e EA_PORT=8080 \
    -e API_KEY="Your_cryptocompare_API_key" \
    cryptocompare-vwap-adapter
```


To get CryptoCompare API credentials, check out https://min-api.cryptocompare.com/.

## Testing

Once the docker container is deployed, run the following `curl` request to test that the adapter is querying the API correctly and outputting a valid response.

```
curl -H "Content-Type: application/json" -d '{"id":"1234","data":{"coin":"AMPL"}}' http://localhost:8080/

```
#### Sample Response

```json
{
  "jobRunID":"1234",
  "data":{
    "markets":[
      {"exchange":"Bitfinex","exchange_fsym":"AMP","exchange_tsym":"USD","fsym":"AMPL","tsym":"USD","last_update":1561732980},
      {"exchange":"Bitfinex","exchange_fsym":"AMP","exchange_tsym":"UST","fsym":"AMPL","tsym":"USDT","last_update":1561732985}
    ],
    "results":{
      "AMPL":{
        "USD":1.041,
        "USDT":1.124
      }
    },
    "conversions":[{
      "USDT":{
        "USD":1.001
      }
    }],
    "result":1.083062
  },
  "result":1.083062,
  "statusCode":200
}
```


