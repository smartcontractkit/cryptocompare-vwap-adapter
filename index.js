const request = require('request-promise')

const createRequest = async (input, callback) => {
  const coin = input.data.coin || 'AMPL'
  const options = {
    url: 'https://min-api.cryptocompare.com/data/pricehistorical',
    qs: {
      api_key: process.env.API_KEY,
      tryConversion: false,
      calculationType: 'VolFVolT'
    },
    json: true
  }
  const markets = await getMarkets(coin)
  if (badResponse(markets)) {
    return callback(500, {
      jobRunID: input.id,
      error: 'Coin not found',
      status: 'errored',
      statusCode: 500
    })
  }
  const rawResults = await queryMarkets(coin, markets, options)
  if (badResponse(rawResults)) {
    return callback(500, {
      jobRunID: input.id,
      error: 'Could not query markets',
      status: 'errored',
      statusCode: 500
    })
  }
  const conversions = await getConversions(coin, rawResults, options)
  const vwap = calculateResults(coin, rawResults, conversions)
  const allData = {
    markets: markets,
    results: rawResults,
    conversions: conversions,
    result: vwap
  }
  callback(200, {
    jobRunID: input.id,
    data: allData,
    result: vwap,
    statusCode: 200
  })
}

const badResponse = (obj) => {
  if (Object.keys(obj).length === 0 && obj.constructor === Object) return true
  if (obj.Response == 'Error') return true
  return false
}

// Get all the markets for a given coin
const getMarkets = async (coin) => {
  const allMarkets = await request({
    url: 'https://min-api.cryptocompare.com/data/pair/mapping/fsym',
    qs: {
      api_key: process.env.API_KEY,
      fsym: coin
    },
    json: true
  })
  return allMarkets.Data
}

// Get the rate for each market of a given coin
const queryMarkets = async (coin, markets, options) => {
  const tsymsArr = []
  for (let i = 0; i < markets.length; i++) {
    tsymsArr.push(markets[i].tsym)
  }
  const tsymsSet = [...new Set(tsymsArr)] // remove duplicates
  let tsyms = ""
  for (let i = 0; i < tsymsSet.length; i++) {
    if (tsyms.length < 27) {
      tsyms += tsymsSet[i] + ","
    }
  }
  tsyms = tsyms.slice(0, -1)
  options.qs.fsym = coin
  options.qs.tsyms = tsyms
  return await request(options)
}

// Get the rate in USD for non-USD markets
const getConversions = async (coin, markets, options) => {
  const conversions = []
  const keys = Object.keys(markets[coin])
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() !== 'usd') {
      options.qs.fsym = keys[i]
      options.qs.tsyms = 'USD'
      conversions.push(await request(options))
    }
  }
  return conversions
}

// Get the VWAP of all markets converted to USD
const calculateResults = (coin, rawResults, conversions) => {
  const prices = []
  const keys = Object.keys(rawResults[coin])
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() !== 'usd') {
      const conversion = conversions.find(c => c[keys[i]])
      const price = +rawResults[coin][keys[i]] * +conversion[keys[i]].USD
      prices.push(price)
    } else {
      prices.push(+rawResults[coin][keys[i]])
    }
  }
  return average(prices)
}

const average = (prices) => {
  return prices.reduce((a, b) => a + b, 0) / prices.length
}

exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}

module.exports.createRequest = createRequest
