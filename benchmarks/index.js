'use strict'

var bench = require('fastbench')
var pino = require('pino')
var noir = require('../')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var pinoTop = pino(dest)
var noirTop = pino({serializers: noir(['top'])}, dest)
var pinoNested = pino(dest)
var noirNested = pino({serializers: noir(['top.nested'])}, dest)
var pinoDeepNested = pino(dest)
var noirDeepNested = pino({serializers: noir(['top.deep.nested'])}, dest)
var pinoVeryDeepNested = pino(dest)
var noirVeryDeepNested = pino({serializers: noir(['top.very.deep.nested'])}, dest)
var pinoWildcards = pino(dest)
var noirWildcards = pino({serializers: noir(['top.deep.*'])}, dest)
var pinoFunctionCensor = pino(dest)
var noirFunctionCensor = pino({serializers: noir(['top.nested.*'], (v) => v + '.')}, dest)
var max = 10

var run = bench([
  function benchPinoTopLevel (cb) {
    for (var i = 0; i < max; i++) {
      pinoTop.info({top: 'hello world'})
    }
    setImmediate(cb)
  },
  function benchNoirTopLevel (cb) {
    for (var i = 0; i < max; i++) {
      noirTop.info({top: 'hello world'})
    }
    setImmediate(cb)
  },
  function benchPinoNested (cb) {
    for (var i = 0; i < max; i++) {
      pinoNested.info({top: {nested: 'hello world'}})
    }
    setImmediate(cb)
  },
  function benchNoirNested (cb) {
    for (var i = 0; i < max; i++) {
      noirNested.info({top: {nested: 'hello world'}})
    }
    setImmediate(cb)
  },
  function benchPinoDeepNested (cb) {
    for (var i = 0; i < max; i++) {
      pinoDeepNested.info({top: {deep: {nested: 'hello world'}}})
    }
    setImmediate(cb)
  },
  function benchNoirDeepNested (cb) {
    for (var i = 0; i < max; i++) {
      noirDeepNested.info({top: {deep: {nested: 'hello world'}}})
    }
    setImmediate(cb)
  },
  function benchPinoVeryDeepNested (cb) {
    for (var i = 0; i < max; i++) {
      pinoVeryDeepNested.info({top: {very: {deep: {nested: 'hello world'}}}})
    }
    setImmediate(cb)
  },
  function benchNoirVeryDeepNested (cb) {
    for (var i = 0; i < max; i++) {
      noirVeryDeepNested.info({top: {very: {deep: {nested: 'hello world'}}}})
    }
    setImmediate(cb)
  },
  function benchPinoWildcardStructure (cb) {
    for (var i = 0; i < max; i++) {
      pinoWildcards.info({top: {deep: {nested: 'hello world', a: 1}}})
    }
    setImmediate(cb)
  },
  function benchNoirWildcards (cb) {
    for (var i = 0; i < max; i++) {
      noirWildcards.info({top: {deep: {nested: 'hello world', a: 1}}})
    }
    setImmediate(cb)
  },
  function benchPinoFunctionCensor (cb) {
    for (var i = 0; i < max; i++) {
      pinoFunctionCensor.info({top: {nested: 'hello world'}})
    }
    setImmediate(cb)
  },
  function benchNoirFunctionCensor (cb) {
    for (var i = 0; i < max; i++) {
      noirFunctionCensor.info({top: {nested: 'hello world'}})
    }
    setImmediate(cb)
  }
], 10000)

run(run)
