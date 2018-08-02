const SECPow = require('../src/index.js')
const level = require('level')
const path = require('path')

const cacheDB = level(path.join(__dirname, '../db/cacheDB/'))
// const datasetDB = level(path.join(__dirname, '../db/datasetDB/'))
const config = {
  cacheDB: cacheDB
  // datasetDB: datasetDB
}

let secPow = new SECPow(config)
// make the 1024 cache items with a seed of 0 * 32
// secPow._mkcache(1024, Buffer.alloc(32).fill(0))

const difficulty = 256
let block = {
  Height: 1,
  Header: Buffer.from('1234')
}

secPow.mineLight(block, difficulty, function (nonce, result) {
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
    console.log('this is verification result:')
    console.log(result)
  })
})
