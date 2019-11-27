const assert = require('chai').assert
const createRequest = require('../index.js').createRequest

describe('createRequest', () => {
  const jobID = '278c97ffadb54a5bbb93cfec5f7b5503'

  context('when specifying a coin', () => {
    const req = {
      id: jobID,
      data: {
        coin: 'AMPL'
      }
    }

    it('returns data to the node', (done) => {
      createRequest(req, (statusCode, data) => {
        assert.equal(statusCode, 200)
        assert.equal(data.jobRunID, jobID)
        assert.isNotEmpty(data.data)
        console.log(JSON.stringify(data, null, 1))
        done()
      })
    })
  })

  context('when the coin is not found', () => {
    const req = {
      id: jobID,
      data: {
        coin: 'NOTREAL'
      }
    }

    it('returns data to the node', (done) => {
      createRequest(req, (statusCode, data) => {
        assert.equal(statusCode, 500)
        assert.equal(data.jobRunID, jobID)
        assert.equal(data.error, 'Coin not found')
        assert.equal(data.status, 'errored')
        console.log(JSON.stringify(data, null, 1))
        done()
      })
    })
  })
})
