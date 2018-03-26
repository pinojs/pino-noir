'use strict'

var test = require('tap').test
var stringify = require('fast-safe-stringify')
var clone = require('clone')
var noir = require('../')

test('redacts top level keys', function (t) {
  var serializers = noir(['test1', 'test2'])
  t.is(stringify(serializers.test1({})), '"[Redacted]"')
  t.is(stringify(serializers.test2({})), '"[Redacted]"')
  t.is(stringify(serializers.test1('prim')), '"[Redacted]"')
  t.end()
})

test('masks according to supplied censor', function (t) {
  var censor = 'test'
  var serializers = noir(['test1', 'test2'], censor)
  t.is(stringify(serializers.test1({})), '"' + censor + '"')
  t.is(stringify(serializers.test2({})), '"' + censor + '"')
  t.end()
})

test('masks according to supplied censor function', function (t) {
  // this censor function can be anything. here we're just masking with 3 Xs and last 2 characters of given value.
  var censor = function (val) { if (!val) return ''; return 'xxx' + val.substr(-2) }
  var serializers = noir(['test1.test', 'test2'], censor)
  t.is(stringify(serializers.test1({test: 'test', a: 1})), '{"test":"xxxst","a":1}')
  t.is(stringify(serializers.test2({})), '""')
  t.end()
})

test('redacts nested keys', function (t) {
  var serializers = noir(['test1.test', 'test2.testa.testb', 'test3[1]', 'test4[2].foo[3]'])
  t.is(stringify(serializers.test1({test: 'test', a: 1})), '{"test":"[Redacted]","a":1}')
  t.is(stringify(serializers.test2({testa: {testb: 'test', b: 2}, a: 1})), '{"testa":{"testb":"[Redacted]","b":2},"a":1}')
  t.is(stringify(serializers.test3(['a', 'b', 'c'])), '["a","[Redacted]","c"]')
  t.is(stringify(serializers.test4(['a', 'b', {foo: ['a', 'b', 'c', {oh: 'oh'}]}])), '["a","b",{"foo":["a","b","c","[Redacted]"]}]')
  t.end()
})

test('test hasOwnProperty', function (t) {
  var serializers = noir(['test1.test', 'test2.testa.testb'])
  var obj1 = Object.create(null)
  obj1.test = 'test'
  obj1.a = 1
  t.is(stringify(serializers.test1(obj1)), '{"test":"[Redacted]","a":1}')
  var obj2 = Object.create(null)
  obj2.testa = { testb: 'test', b: 2 }
  obj2.a = 1
  t.is(stringify(serializers.test2(obj2)), '{"testa":{"testb":"[Redacted]","b":2},"a":1}')
  t.end()
})

test('handles paths that do not match', function (t) {
  t.is(stringify(noir(['top.shoe']).top({top: {very: {deep: {nested: 'hello world'}}}})), '{"top":{"very":{"deep":{"nested":"hello world"}}}}')
  t.is(stringify(noir(['top.deep.nested']).top({top: {very: {deep: {nested: 'hello world'}}}})), '{"top":{"very":{"deep":{"nested":"hello world"}}}}')
  t.end()
})

test('ignores non-matching key paths', function (t) {
  var serializers = noir(['foo.shoe', 'foo.bar'])
  t.is(stringify(serializers.foo({baz: 1, bar: 'private'})), '{"baz":1,"bar":"[Redacted]"}')
  t.end()
})

test('supports wild cards', function (t) {
  var serializers = noir(['test.*', 'deep.bar.baz.ding.*', 'array[*]', 'deepArray.down.here[*]', 'insideArray.like[3].this.*'])
  t.is(stringify(serializers.test({baz: 1, bar: 'private'})), '{"baz":"[Redacted]","bar":"[Redacted]"}')
  t.is(stringify(serializers.deep({a: 1, bar: {b: 2, baz: {c: 3, ding: {d: 4, e: 5, f: 'six'}}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":{"d":"[Redacted]","e":"[Redacted]","f":"[Redacted]"}}}}')
  t.is(stringify(serializers.array(['a', 'b', 'c', 'd'])), '["[Redacted]","[Redacted]","[Redacted]","[Redacted]"]')
  t.is(stringify(serializers.deepArray({down: {here: ['a', 'b', 'c']}})), '{"down":{"here":["[Redacted]","[Redacted]","[Redacted]"]}}')
  t.is(stringify(serializers.insideArray({like: ['a', 'b', 'c', {this: {foo: 'meow'}}]})), '{"like":["a","b","c",{"this":{"foo":"[Redacted]"}}]}')
  t.end()
})

test('wild cards overwrite primitives', function (t) {
  var serializers = noir(['test.*', 'deep.bar.baz.ding.*', 'array[*]', 'deepArray.down.here[*]', 'insideArray.like[3].this.*'])
  t.is(stringify(serializers.test('foo')), '"[Redacted]"')
  t.is(stringify(serializers.deep({a: 1, bar: {b: 2, baz: {c: 3, ding: 'meow'}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":"[Redacted]"}}}')
  t.is(stringify(serializers.array('ooooh')), '"[Redacted]"')
  t.is(stringify(serializers.deepArray({down: {here: 'abc'}})), '{"down":{"here":"[Redacted]"}}')
  t.is(stringify(serializers.insideArray({like: ['a', 'b', 'c', {this: 'meow'}]})), '{"like":["a","b","c",{"this":"[Redacted]"}]}')
  t.end()
})

test('handles circulars', function (t) {
  var serializers = noir(['deep.bar.baz.*'])
  var o = {a: 1, bar: {b: 2}}
  var prev = clone(o.bar)
  prev.baz = prev
  o.bar.baz = o.bar
  t.is(stringify(serializers.deep(o)), '{"a":1,"bar":{"b":"[Redacted]","baz":"[Redacted]"}}')
  t.deepEqual(o.bar, prev)
  t.deepEqual(o.bar.baz, prev)
  t.end()
})

test('handles deep circulars', function (t) {
  var serializers = noir(['deep.bar.baz.ding.*'])
  var o = {a: 1, bar: {b: 2, baz: {c: 3}}}
  var prev = clone(o.bar)
  prev.baz.ding = prev
  o.bar.baz.ding = o.bar
  t.is(stringify(serializers.deep(o)), '{"a":1,"bar":{"b":"[Redacted]","baz":"[Redacted]"}}')
  t.deepEqual(o.bar, prev)
  t.deepEqual(o.bar.baz.ding, prev)
  t.end()
})

test('censor may be any type', function (t) {
  t.is(stringify(noir(['test1'], {redacted: true}).test1({})), '{"redacted":true}')
  t.is(stringify(noir(['test1'], 1).test1({})), '1')
  t.is(stringify(noir(['test1'], null).test1({})), 'null')
  t.is(stringify(noir(['deep.bar.baz.ding'], {redacted: true}).deep({a: 1, bar: {b: 2, baz: {c: 3, ding: 'meow'}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":{"redacted":true}}}}')
  t.is(stringify(noir(['deep.bar.baz.ding'], 1).deep({a: 1, bar: {b: 2, baz: {c: 3, ding: 'meow'}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":1}}}')
  t.is(stringify(noir(['deep.bar.baz.ding'], null).deep({a: 1, bar: {b: 2, baz: {c: 3, ding: 'meow'}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":null}}}')
  t.is(stringify(noir(['deep.bar.baz.ding.*'], {redacted: true}).deep({a: 1, bar: {b: 2, baz: {c: 3, ding: 'meow'}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":{"redacted":true}}}}')
  t.is(stringify(noir(['deep.bar.baz.ding.*'], 1).deep({a: 1, bar: {b: 2, baz: {c: 3, ding: 'meow'}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":1}}}')
  t.is(stringify(noir(['deep.bar.baz.ding.*'], null).deep({a: 1, bar: {b: 2, baz: {c: 3, ding: 'meow'}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":null}}}')
  t.end()
})

test('explicitly setting censor to undefined strips property', function (t) {
  var serializers = noir(['test0', 'test1.test', 'test2.testa.testb', 'test3[1]', 'test4[2].foo[3]'], undefined)
  t.is(stringify(serializers.test0({})), undefined)
  t.is(stringify(serializers.test1({test: 'test', a: 1})), '{"a":1}')
  t.is(stringify(serializers.test2({testa: {testb: 'test', b: 2}, a: 1})), '{"testa":{"b":2},"a":1}')
  t.is(stringify(serializers.test3(['a', 'b', 'c'])), '["a",null,"c"]')
  t.is(stringify(serializers.test4(['a', 'b', {foo: ['a', 'b', 'c', {oh: 'oh'}]}])), '["a","b",{"foo":["a","b","c",null]}]')
  t.end()
})

test('multiple paths from the same root', function (t) {
  t.is(stringify(noir(['deep.bar.baz.ding', 'deep.foo.fum']).deep(
    {bar: {baz: {ding: 'meow'}}, foo: {fum: 'weee', fo: 'meow'}}
  )), '{"bar":{"baz":{"ding":"[Redacted]"}},"foo":{"fum":"[Redacted]","fo":"meow"}}')
  t.is(stringify(noir(['deep.bar.shoe', 'deep.baz.shoe', 'deep.foo', 'deep.not.there.sooo', 'deep.fum.shoe']).deep(
    {bar: 'hmm', baz: {shoe: {k: 1}}, foo: {}, fum: {shoe: 'moo'}}
  )), '{"bar":"hmm","baz":{"shoe":"[Redacted]"},"foo":"[Redacted]","fum":{"shoe":"[Redacted]"}}')
  t.end()
})

test('edge cases', function (t) {
  var serializers = noir(['test1.test', 'test2.testa.testb', 'test3[1]', 'test4[2].foo[3]'])
  t.is(stringify(serializers.test1({test: NaN, a: 1})), '{"test":"[Redacted]","a":1}')
  t.is(stringify(noir(['deep.bar.baz.ding']).deep({a: 1, bar: {b: 2, baz: {c: 3, ding: NaN}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":"[Redacted]"}}}')
  t.is(stringify(serializers.test1({test: undefined, a: 1})), '{"a":1}')
  t.is(stringify(serializers.test1({test: null, a: 1})), '{"test":"[Redacted]","a":1}')
  t.is(stringify(noir(['deep.bar.baz.ding']).deep(NaN)), 'null')
  t.is(stringify(noir(['deep.bar.baz.ding']).deep(1)), '1')
  t.is(stringify(noir(['deep.bar.baz.ding']).deep('1')), '"1"')
  t.is(stringify(noir(['deep.bar.baz.ding']).deep(null)), 'null')
  t.is(stringify(noir(['deep.bar.baz.ding']).deep(false)), 'false')
  t.is(stringify(noir(['deep.bar.baz.ding']).deep(undefined)), undefined)
  t.end()
})

test('redacts nested keys with a custom serializers', function (t) {
  t.plan(2)
  var fixture = {
    something: 'else'
  }
  var serializers = noir({
    test: function (obj) {
      t.is(fixture, obj)
      return {
        test1: 'should be redacted',
        a: 1
      }
    }
  }, ['test.test1'])
  t.is(stringify(serializers.test(fixture)), '{"test1":"[Redacted]","a":1}')
})

test('pass through existing serializers', function (t) {
  t.plan(2)
  var fixture = {
    something: 'else'
  }
  var serializers = noir({
    test: function (obj) {
      t.is(fixture, obj)
      return {
        a: 1
      }
    }
  }, ['to.be.redacted'])
  t.is(stringify(serializers.test(fixture)), '{"a":1}')
})
