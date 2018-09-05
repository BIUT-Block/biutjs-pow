const SecUtils = require('@sec-block/secjs-util')
const randomGen = require('../src/secjs-random-generate')
const secHashUtil = require('./util.js')
const xor = require('buffer-xor')
const level = require('level')
const events = require('events')

const secUtil = new SecUtils()

class SECPow {
  /**
   * @param  {Object} config - JSON format configurations for constructor
   */
  constructor (config) {
    this.dbOpts = {
      valueEncoding: 'json'
    }

    if ('cacheDBPath' in config) {
      this.cacheDB = level(config.cacheDBPath)
    } else {
      throw new Error('SECPow constructor invalid input')
    }
    this.cache = false
    this.event = new events.EventEmitter()
  }

  /**
   * Create a cache
   * @param  {Integer} cacheSize - created cache size
   * @param  {Buffer} seed - cache seed
   * @return {Buffer[]}
   */
  _mkcache (cacheSize, seed) {
    const n = Math.floor(cacheSize / secHashUtil.params.HASH_BYTES)
    let o = [secUtil.sha3(seed, 512)]

    for (let i = 1; i < n; i++) {
      o.push(secUtil.sha3(o[o.length - 1], 512))
    }

    for (let _ = 0; _ < secHashUtil.params.CACHE_ROUNDS; _++) {
      for (let i = 0; i < n; i++) {
        let v = o[i].readUInt32LE(0) % n
        o[i] = secUtil.sha3(xor(o[(i - 1 + n) % n], o[v]), 512)
      }
    }

    this.cache = o
    return this.cache
  }

  /**
   * Calculate an item for dataset
   * @param  {Integer} i - index
   * @return {Buffer}
   */
  _calcDatasetItem (i) {
    const n = this.cache.length
    const r = Math.floor(secHashUtil.params.HASH_BYTES / secHashUtil.params.WORD_BYTES)
    let mix = Buffer.from(this.cache[i % n])
    mix.writeInt32LE(mix.readUInt32LE(0) ^ i, 0)
    mix = secUtil.sha3(mix, 512)
    for (let j = 0; j < secHashUtil.params.DATASET_PARENTS; j++) {
      let cacheIndex = secHashUtil.fnv(i ^ j, mix.readUInt32LE(j % r * 4))
      mix = secHashUtil.fnvBuffer(mix, this.cache[cacheIndex % n])
    }
    return secUtil.sha3(mix, 512)
  }

  /**
   * Calculate pow hash
   * @param  {Buffer} val - block header data
   * @param  {Buffer} nonce - proof of work
   * @param  {Integer} fullSize - dataset size
   * @return {Object}
   */
  _run (val, nonce, fullSize) {
    fullSize = fullSize || this.fullSize
    const n = Math.floor(fullSize / secHashUtil.params.HASH_BYTES)
    const w = Math.floor(secHashUtil.params.MIX_BYTES / secHashUtil.params.WORD_BYTES)
    const s = secUtil.sha3(Buffer.concat([val, secHashUtil.bufReverse(nonce)]), 512)
    const mixhashes = Math.floor(secHashUtil.params.MIX_BYTES / secHashUtil.params.HASH_BYTES)
    let mix = Buffer.concat(Array(mixhashes).fill(s))

    for (let i = 0; i < secHashUtil.params.ACCESSES; i++) {
      let p = secHashUtil.fnv(i ^ s.readUInt32LE(0), mix.readUInt32LE(i % w * 4)) % Math.floor(n / mixhashes) * mixhashes
      let newdata = []
      for (let j = 0; j < mixhashes; j++) {
        newdata.push(this._calcDatasetItem(p + j))
      }

      newdata = Buffer.concat(newdata)
      mix = secHashUtil.fnvBuffer(mix, newdata)
    }

    let cmix = Buffer.alloc(mix.length / 4)
    for (let i = 0; i < mix.length / 4; i = i + 4) {
      let a = secHashUtil.fnv(mix.readUInt32LE(i * 4), mix.readUInt32LE((i + 1) * 4))
      let b = secHashUtil.fnv(a, mix.readUInt32LE((i + 2) * 4))
      let c = secHashUtil.fnv(b, mix.readUInt32LE((i + 3) * 4))
      cmix.writeUInt32LE(c, i)
    }

    return {
      mix: cmix,
      hash: secUtil.sha3(Buffer.concat([s, cmix]))
    }
  }

  /**
   * Loads the seed and the cache given a block number
   * @param  {Integer} number - block height
   * @param  {Function} callback - callback function
   * @return {None}
   */
  _loadEpoc (number, callback) {
    let self = this
    const epoc = secHashUtil.getEpoc(number)

    if (this.epoc === epoc) {
      return callback()
    }

    this.epoc = epoc

    // gives the seed the first epoc found
    function findLastSeed (epoc, callback2) {
      if (epoc === 0) {
        return callback2(secUtil.zeros(32), 0)
      }

      self.cacheDB.get(epoc, self.dbOpts, function (err, data) {
        if (!err) {
          callback2(data.seed, epoc)
        } else {
          findLastSeed(epoc - 1, callback2)
        }
      })
    }

    /* eslint-disable handle-callback-err */
    self.cacheDB.get(epoc, self.dbOpts, function (err, data) {
      if (!data) {
        self.cacheSize = secHashUtil.getCacheSize(epoc)
        self.fullSize = secHashUtil.getFullSize(epoc)

        findLastSeed(epoc, function (seed, foundEpoc) {
          self.seed = secHashUtil.getSeed(seed, foundEpoc, epoc)
          let cache = self._mkcache(self.cacheSize, self.seed)
          // store the generated cache
          self.cacheDB.put(epoc, {
            cacheSize: self.cacheSize,
            fullSize: self.fullSize,
            seed: self.seed,
            cache: cache
          }, self.dbOpts, callback())
        })
      } else {
        self.cacheSize = data.cacheSize
        self.fullSize = data.fullSize
        self.seed = Buffer.from(data.seed)
        self.cache = data.cache.map(function (a) {
          return Buffer.from(a)
        })
        callback()
      }
    })
    /* eslint-enable handle-callback-err */
  }

  /**
   * Verify correctness of pow result
   * @param  {Object} block - single block data
   * @param  {Function} callback - callback function
   * @return {None}
   */
  async verifyPOW (block, callback) {
    if (block.Height === 0) {
      callback(true)
      return
    }

    let self = this

    this._loadEpoc(block.Height, function () {
      let result = self._run(block.Header, Buffer.from(block.Nonce, 'hex'))
      let mixCheck = false
      if (Buffer.compare(result.mix, block.MixHash) === 0) {
        mixCheck = true
      }

      let target = self._targetCalc(block.Difficulty)
      let hashCheck = self._bufferCompare(target, result.hash)

      callback(mixCheck && hashCheck)
    })
  }

  /**
   * Compare buffers magnitude (buffer => hex value => compare)
   * @param  {Buffer} buf1 - buffer 1
   * @param  {Buffer} buf2 - buffer 2
   * @return {Boolean}
   */
  _bufferCompare (buf1, buf2) {
    if (buf1.length > buf2.length) {
      for (let i = 0; i < buf1.length - buf2.length; i++) {
        buf2 = Buffer.concat([Buffer.alloc(1), buf2])
      }
    } else if (buf1.length < buf2.length) {
      for (let i = 0; i < buf2.length - buf1.length; i++) {
        buf1 = Buffer.concat([Buffer.alloc(1), buf1])
      }
    }

    if (buf1 >= buf2) {
      return true
    }
    return false
  }

  /**
   * Calculate target value according to pow difficulty
   * @param  {Integer} difficulty - difficulty value
   * @return {Buffer}
   */
  _targetCalc (difficulty) {
    const pow256 = '010000000000000000000000000000000000000000000000000000000000000000'
    let target = Math.floor(parseInt(pow256, 16) / difficulty).toString(16)
    target = Buffer.from(('0'.repeat(target.length % 2) + target), 'hex')

    return target
  }

  /**
   * Light client mining function
   * @param  {Object} block - single block data
   * @param  {Integer} difficulty - difficulty value
   * @param  {Function} callback - callback function
   * @return {None}
   */
  async mineLight (block, difficulty, callback) {
    let self = this
    let stopFlag = false

    this.event.on('stop_mining', function () {
      console.log('this is in stop event')
      stopFlag = true
    })

    this._loadEpoc(block.Height, function () {
      let target = self._targetCalc(difficulty)
      let nonce = randomGen.randomGenerate('hex', 16)

      while (self._bufferCompare(self._run(block.Header, Buffer.from(nonce, 'hex')).hash, target)) {
        if (stopFlag) {
          return callback(null, null)
        }
        nonce = randomGen.randomGenerate('hex', 16)
      }
      callback(nonce, self._run(block.Header, Buffer.from(nonce, 'hex')))
    })
  }

  /**
   * Calculate full dataset (for full client only)
   * @return {Buffer[]}
   */
  _calcDataset () {
    let buffer = []

    for (let i = 0; i < Math.floor(this.fullSize / secHashUtil.params.HASH_BYTES); i++) {
      buffer.push(this._calcDatasetItem(i))
    }

    return buffer
  }

  // Stop the mining function
  stopMining () {
    this.event.emit('stop_mining')
  }
}

module.exports = SECPow
