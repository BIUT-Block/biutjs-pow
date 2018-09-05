const expect = require('chai').expect
const path = require('path')
const SECPow = require('../src/index')

describe('SECPow lib test', () => {
  it('Mining and nonce verification test', (done) => {
    const cacheDBPath = path.join(__dirname, '../db/cacheDB/')
    const config = {
      cacheDBPath: cacheDBPath
    }
    let secPow = new SECPow(config)

    const difficulty = 256
    let block = {
      Height: 1,
      Header: Buffer.from('1234')
    }

    secPow.mineLight(block, difficulty, function (nonce, result) {
      if (nonce !== null) {
        console.log(result.mix)
        console.log(result.hash)

        block = {
          Height: 1,
          Difficulty: difficulty,
          Header: Buffer.from('1234'),
          MixHash: result.mix,
          Nonce: nonce
        }

        secPow.verifyPOW(block, function (result) {
          expect(result).to.be.true
          done()
        })
      }
    })
  }).timeout('20s')
})
