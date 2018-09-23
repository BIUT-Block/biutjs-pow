<a name="SECPow"></a>

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard) 

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)]

## SECPow

This library is for sec blockchain pow mining and verification

* [SECPow](#SECPow)
    * [new SECPow(config)](#new_SECPow_new)
    * [.verifyPOW(block, callback)](#SECPow+verifyPOW) => <code>None</code>
    * [.mineLight(block, difficulty, callback)](#SECPow+mineLight) => <code>None</code>
    * [.calcDifficulty(parentDiff, parentBlockNumber, parentTimeStamp, currentTimestamp)](#SECPow+calcDifficulty) => <code>Number</code>
    * [.stopMining()](#SECPow+stopMining) => <code>None</code>

<a name="new_SECPow_new"></a>

### new SECPow(config)

| Param | Type | Description |
| --- | --- | --- |
| config | <code>Object</code> | JSON format configurations for constructor |

<a name="SECPow+verifyPOW"></a>

### secPow.verifyPOW(block, callback) => <code>None</code>
Verify correctness of pow result

**Kind**: instance method of [<code>SECPow</code>](#SECPow)  

| Param | Type | Description |
| --- | --- | --- |
| block | <code>Object</code> | single block data |
| callback | <code>function</code> | callback function |

<a name="SECPow+mineLight"></a>

### secPow.mineLight(block, difficulty, callback) => <code>None</code>
Light client mining function

**Kind**: instance method of [<code>SECPow</code>](#SECPow)  

| Param | Type | Description |
| --- | --- | --- |
| block | <code>Object</code> | single block data |
| difficulty | <code>Integer</code> | difficulty value |
| callback | <code>function</code> | callback function |

<a name="SECPow+calcDifficulty"></a>

### secPow.calcDifficulty(parentDiff, parentBlockNumber, parentTimeStamp, currentTimestamp) => <code>Number</code>
Calculate POW difficulty for next block

**Kind**: instance method of [<code>SECPow</code>](#SECPow)  

| Param | Type | Description |
| --- | --- | --- |
| parentDiff | <code>Number</code> | parent block difficulty value |
| parentBlockNumber | <code>Integer</code> | parent block number |
| parentTimeStamp | <code>Integer</code> | parent block generated timestamp |
| currentTimestamp | <code>Integer</code> | current generated timestamp |

<a name="SECPow+stopMining"></a>

### secPow.stopMining() => <code>None</code>
Stop the mining operation
