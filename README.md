<a name="SECPow"></a>

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard) 

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)]

## SECPow

This library is for sec blockchain pow mining and verification

* [SECPow](#SECPow)
    * [new SECPow(config)](#new_SECPow_new)
    * [.verifyPOW(block, callback)](#SECPow+verifyPOW) => <code>None</code>
    * [.mineLight(block, difficulty, callback)](#SECPow+mineLight) => <code>None</code>

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
