'use strict'

const test = require('node:test')
const assert = require('node:assert')
const stringify = require('fast-safe-stringify')
const clone = require('clone')
const noir = require('../')

test('redacts top level keys', function () {
  const serializers = noir(['test1', 'test2'])
  assert.equal(stringify(serializers.test1({})), '"[Redacted]"')
  assert.equal(stringify(serializers.test2({})), '"[Redacted]"')
  assert.equal(stringify(serializers.test1('prim')), '"[Redacted]"')
})

test('masks according to supplied censor', function () {
  const censor = 'test'
  const serializers = noir(['test1', 'test2'], censor)
  assert.equal(stringify(serializers.test1({})), '"' + censor + '"')
  assert.equal(stringify(serializers.test2({})), '"' + censor + '"')
})

test('masks according to supplied censor function', function () {
  // this censor function can be anything. here we're just masking with 3 Xs and last 2 characters of given value.
  const censor = function (val) { if (!val) return ''; return 'xxx' + val.substr(-2) }
  const serializers = noir(['test1.test', 'test2'], censor)
  assert.equal(stringify(serializers.test1({ test: 'test', a: 1 })), '{"test":"xxxst","a":1}')
  assert.equal(stringify(serializers.test2({})), '""')
})

test('redacts nested keys', function () {
  const serializers = noir(['test1.test', 'test2.testa.testb', 'test3[1]', 'test4[2].foo[3]'])
  assert.equal(stringify(serializers.test1({ test: 'test', a: 1 })), '{"test":"[Redacted]","a":1}')
  assert.equal(stringify(serializers.test2({ testa: { testb: 'test', b: 2 }, a: 1 })), '{"testa":{"testb":"[Redacted]","b":2},"a":1}')
  assert.equal(stringify(serializers.test3(['a', 'b', 'c'])), '["a","[Redacted]","c"]')
  assert.equal(stringify(serializers.test4(['a', 'b', { foo: ['a', 'b', 'c', { oh: 'oh' }] }])), '["a","b",{"foo":["a","b","c","[Redacted]"]}]')
})

test('test hasOwnProperty', function () {
  const serializers = noir(['test1.test', 'test2.testa.testb'])
  const obj1 = Object.create(null)
  obj1.test = 'test'
  obj1.a = 1
  assert.equal(stringify(serializers.test1(obj1)), '{"test":"[Redacted]","a":1}')
  const obj2 = Object.create(null)
  obj2.testa = { testb: 'test', b: 2 }
  obj2.a = 1
  assert.equal(stringify(serializers.test2(obj2)), '{"testa":{"testb":"[Redacted]","b":2},"a":1}')
})

test('handles paths that do not match', function () {
  assert.equal(stringify(noir(['top.shoe']).top({ top: { very: { deep: { nested: 'hello world' } } } })), '{"top":{"very":{"deep":{"nested":"hello world"}}}}')
  assert.equal(stringify(noir(['top.deep.nested']).top({ top: { very: { deep: { nested: 'hello world' } } } })), '{"top":{"very":{"deep":{"nested":"hello world"}}}}')
})

test('ignores non-matching key paths', function () {
  const serializers = noir(['foo.shoe', 'foo.bar'])
  assert.equal(stringify(serializers.foo({ baz: 1, bar: 'private' })), '{"baz":1,"bar":"[Redacted]"}')
})

test('supports wild cards', function () {
  const serializers = noir(['test.*', 'deep.bar.baz.ding.*', 'array[*]', 'deepArray.down.here[*]', 'insideArray.like[3].this.*'])
  assert.equal(stringify(serializers.test({ baz: 1, bar: 'private' })), '{"baz":"[Redacted]","bar":"[Redacted]"}')
  assert.equal(stringify(serializers.deep({ a: 1, bar: { b: 2, baz: { c: 3, ding: { d: 4, e: 5, f: 'six' } } } })), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":{"d":"[Redacted]","e":"[Redacted]","f":"[Redacted]"}}}}')
  assert.equal(stringify(serializers.array(['a', 'b', 'c', 'd'])), '["[Redacted]","[Redacted]","[Redacted]","[Redacted]"]')
  assert.equal(stringify(serializers.deepArray({ down: { here: ['a', 'b', 'c'] } })), '{"down":{"here":["[Redacted]","[Redacted]","[Redacted]"]}}')
  assert.equal(stringify(serializers.insideArray({ like: ['a', 'b', 'c', { this: { foo: 'meow' } }] })), '{"like":["a","b","c",{"this":{"foo":"[Redacted]"}}]}')
})

test('wild cards overwrite primitives', function () {
  const serializers = noir(['test.*', 'deep.bar.baz.ding.*', 'array[*]', 'deepArray.down.here[*]', 'insideArray.like[3].this.*'])
  assert.equal(stringify(serializers.test('foo')), '"[Redacted]"')
  assert.equal(stringify(serializers.deep({ a: 1, bar: { b: 2, baz: { c: 3, ding: 'meow' } } })), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":"[Redacted]"}}}')
  assert.equal(stringify(serializers.array('ooooh')), '"[Redacted]"')
  assert.equal(stringify(serializers.deepArray({ down: { here: 'abc' } })), '{"down":{"here":"[Redacted]"}}')
  assert.equal(stringify(serializers.insideArray({ like: ['a', 'b', 'c', { this: 'meow' }] })), '{"like":["a","b","c",{"this":"[Redacted]"}]}')
})

test('handles circulars', function () {
  const serializers = noir(['deep.bar.baz.*'])
  const o = { a: 1, bar: { b: 2 } }
  const prev = clone(o.bar)
  prev.baz = prev
  o.bar.baz = o.bar
  assert.equal(stringify(serializers.deep(o)), '{"a":1,"bar":{"b":"[Redacted]","baz":"[Redacted]"}}')
  assert.deepEqual(o.bar, prev)
  assert.deepEqual(o.bar.baz, prev)
})

test('handles deep circulars', function () {
  const serializers = noir(['deep.bar.baz.ding.*'])
  const o = { a: 1, bar: { b: 2, baz: { c: 3 } } }
  const prev = clone(o.bar)
  prev.baz.ding = prev
  o.bar.baz.ding = o.bar
  assert.equal(stringify(serializers.deep(o)), '{"a":1,"bar":{"b":"[Redacted]","baz":"[Redacted]"}}')
  assert.deepEqual(o.bar, prev)
  assert.deepEqual(o.bar.baz.ding, prev)
})

test('censor may be any type', function () {
  assert.equal(stringify(noir(['test1'], { redacted: true }).test1({})), '{"redacted":true}')
  assert.equal(stringify(noir(['test1'], 1).test1({})), '1')
  assert.equal(stringify(noir(['test1'], null).test1({})), 'null')
  assert.equal(stringify(noir(['deep.bar.baz.ding'], { redacted: true }).deep({ a: 1, bar: { b: 2, baz: { c: 3, ding: 'meow' } } })), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":{"redacted":true}}}}')
  assert.equal(stringify(noir(['deep.bar.baz.ding'], 1).deep({ a: 1, bar: { b: 2, baz: { c: 3, ding: 'meow' } } })), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":1}}}')
  assert.equal(stringify(noir(['deep.bar.baz.ding'], null).deep({ a: 1, bar: { b: 2, baz: { c: 3, ding: 'meow' } } })), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":null}}}')
  assert.equal(stringify(noir(['deep.bar.baz.ding.*'], { redacted: true }).deep({ a: 1, bar: { b: 2, baz: { c: 3, ding: 'meow' } } })), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":{"redacted":true}}}}')
  assert.equal(stringify(noir(['deep.bar.baz.ding.*'], 1).deep({ a: 1, bar: { b: 2, baz: { c: 3, ding: 'meow' } } })), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":1}}}')
  assert.equal(stringify(noir(['deep.bar.baz.ding.*'], null).deep({ a: 1, bar: { b: 2, baz: { c: 3, ding: 'meow' } } })), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":null}}}')
})

test('explicitly setting censor to undefined strips property', function () {
  const serializers = noir(['test0', 'test1.test', 'test2.testa.testb', 'test3[1]', 'test4[2].foo[3]'], undefined)
  assert.equal(stringify(serializers.test0({})), undefined)
  assert.equal(stringify(serializers.test1({ test: 'test', a: 1 })), '{"a":1}')
  assert.equal(stringify(serializers.test2({ testa: { testb: 'test', b: 2 }, a: 1 })), '{"testa":{"b":2},"a":1}')
  assert.equal(stringify(serializers.test3(['a', 'b', 'c'])), '["a",null,"c"]')
  assert.equal(stringify(serializers.test4(['a', 'b', { foo: ['a', 'b', 'c', { oh: 'oh' }] }])), '["a","b",{"foo":["a","b","c",null]}]')
})

test('multiple paths from the same root', function () {
  assert.equal(stringify(noir(['deep.bar.baz.ding', 'deep.foo.fum']).deep(
    { bar: { baz: { ding: 'meow' } }, foo: { fum: 'weee', fo: 'meow' } }
  )), '{"bar":{"baz":{"ding":"[Redacted]"}},"foo":{"fum":"[Redacted]","fo":"meow"}}')
  assert.equal(stringify(noir(['deep.bar.shoe', 'deep.baz.shoe', 'deep.foo', 'deep.not.there.sooo', 'deep.fum.shoe']).deep(
    { bar: 'hmm', baz: { shoe: { k: 1 } }, foo: {}, fum: { shoe: 'moo' } }
  )), '{"bar":"hmm","baz":{"shoe":"[Redacted]"},"foo":"[Redacted]","fum":{"shoe":"[Redacted]"}}')
})

test('edge cases', function () {
  const serializers = noir(['test1.test', 'test2.testa.testb', 'test3[1]', 'test4[2].foo[3]'])
  assert.equal(stringify(serializers.test1({ test: NaN, a: 1 })), '{"test":"[Redacted]","a":1}')
  assert.equal(stringify(noir(['deep.bar.baz.ding']).deep({ a: 1, bar: { b: 2, baz: { c: 3, ding: NaN } } })), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":"[Redacted]"}}}')
  assert.equal(stringify(serializers.test1({ test: undefined, a: 1 })), '{"a":1}')
  assert.equal(stringify(serializers.test1({ test: null, a: 1 })), '{"test":"[Redacted]","a":1}')
  assert.equal(stringify(noir(['deep.bar.baz.ding']).deep(NaN)), 'null')
  assert.equal(stringify(noir(['deep.bar.baz.ding']).deep(1)), '1')
  assert.equal(stringify(noir(['deep.bar.baz.ding']).deep('1')), '"1"')
  assert.equal(stringify(noir(['deep.bar.baz.ding']).deep(null)), 'null')
  assert.equal(stringify(noir(['deep.bar.baz.ding']).deep(false)), 'false')
  assert.equal(stringify(noir(['deep.bar.baz.ding']).deep(undefined)), undefined)
})

test('redacts nested keys with a custom serializers', function (t) {
  t.plan(2)
  const fixture = {
    something: 'else'
  }
  const serializers = noir({
    test: function (obj) {
      t.assert.equal(fixture, obj)
      return {
        test1: 'should be redacted',
        a: 1
      }
    }
  }, ['test.test1'])
  t.assert.equal(stringify(serializers.test(fixture)), '{"test1":"[Redacted]","a":1}')
})

test('pass through existing serializers', function (t) {
  t.plan(2)
  const fixture = {
    something: 'else'
  }
  const serializers = noir({
    test: function (obj) {
      t.assert.equal(fixture, obj)
      return {
        a: 1
      }
    }
  }, ['to.be.redacted'])
  t.assert.equal(stringify(serializers.test(fixture)), '{"a":1}')
})
