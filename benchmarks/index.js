'use strict'

const bench = require('fastbench')
const pino = require('pino')
const noir = require('../')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const pinoTop = pino(dest)
const noirTop = pino({ serializers: noir(['top']) }, dest)
const pinoNested = pino(dest)
const noirNested = pino({ serializers: noir(['top.nested']) }, dest)
const pinoDeepNested = pino(dest)
const noirDeepNested = pino({ serializers: noir(['top.deep.nested']) }, dest)
const pinoVeryDeepNested = pino(dest)
const noirVeryDeepNested = pino({ serializers: noir(['top.very.deep.nested']) }, dest)
const pinoWildcards = pino(dest)
const noirWildcards = pino({ serializers: noir(['top.deep.*']) }, dest)
const pinoFunctionCensor = pino(dest)
const noirFunctionCensor = pino({ serializers: noir(['top.nested.*'], (v) => v + '.') }, dest)
const max = 10

const run = bench([
  function benchPinoTopLevel (cb) {
    for (let i = 0; i < max; i++) {
      pinoTop.info({ top: 'hello world' })
    }
    setImmediate(cb)
  },
  function benchNoirTopLevel (cb) {
    for (let i = 0; i < max; i++) {
      noirTop.info({ top: 'hello world' })
    }
    setImmediate(cb)
  },
  function benchPinoNested (cb) {
    for (let i = 0; i < max; i++) {
      pinoNested.info({ top: { nested: 'hello world' } })
    }
    setImmediate(cb)
  },
  function benchNoirNested (cb) {
    for (let i = 0; i < max; i++) {
      noirNested.info({ top: { nested: 'hello world' } })
    }
    setImmediate(cb)
  },
  function benchPinoDeepNested (cb) {
    for (let i = 0; i < max; i++) {
      pinoDeepNested.info({ top: { deep: { nested: 'hello world' } } })
    }
    setImmediate(cb)
  },
  function benchNoirDeepNested (cb) {
    for (let i = 0; i < max; i++) {
      noirDeepNested.info({ top: { deep: { nested: 'hello world' } } })
    }
    setImmediate(cb)
  },
  function benchPinoVeryDeepNested (cb) {
    for (let i = 0; i < max; i++) {
      pinoVeryDeepNested.info({ top: { very: { deep: { nested: 'hello world' } } } })
    }
    setImmediate(cb)
  },
  function benchNoirVeryDeepNested (cb) {
    for (let i = 0; i < max; i++) {
      noirVeryDeepNested.info({ top: { very: { deep: { nested: 'hello world' } } } })
    }
    setImmediate(cb)
  },
  function benchPinoWildcardStructure (cb) {
    for (let i = 0; i < max; i++) {
      pinoWildcards.info({ top: { deep: { nested: 'hello world', a: 1 } } })
    }
    setImmediate(cb)
  },
  function benchNoirWildcards (cb) {
    for (let i = 0; i < max; i++) {
      noirWildcards.info({ top: { deep: { nested: 'hello world', a: 1 } } })
    }
    setImmediate(cb)
  },
  function benchPinoFunctionCensor (cb) {
    for (let i = 0; i < max; i++) {
      pinoFunctionCensor.info({ top: { nested: 'hello world' } })
    }
    setImmediate(cb)
  },
  function benchNoirFunctionCensor (cb) {
    for (let i = 0; i < max; i++) {
      noirFunctionCensor.info({ top: { nested: 'hello world' } })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
