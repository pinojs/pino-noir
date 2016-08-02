var test = require('tap').test
var noir = require('../')

test('redacts top level keys', function (t) {
  var serializers = noir(['test1', 'test2'])
  t.is(JSON.stringify(serializers.test1({})), '"[Redacted]"')
  t.is(JSON.stringify(serializers.test2({})), '"[Redacted]"')
  t.end()
})

test('masks according to supplied censor', function (t) {
  var censor = 'test'
  var serializers = noir(['test1', 'test2'], censor)
  t.is(JSON.stringify(serializers.test1({})), '"' + censor + '"')
  t.is(JSON.stringify(serializers.test2({})), '"' + censor + '"')
  t.end()
})

test('redacts nested keys', function (t) {
  var serializers = noir(['test1.test', 'test2.testa.testb', 'test3[1]', 'test4[2].foo[3]'])
  t.is(JSON.stringify(serializers.test1({test: 'test', a: 1})), '{"test":"[Redacted]","a":1}')
  t.is(JSON.stringify(serializers.test2({testa: {testb: 'test', b: 2}, a: 1})), '{"testa":{"testb":"[Redacted]","b":2},"a":1}')
  t.is(JSON.stringify(serializers.test3(['a', 'b', 'c'])), '["a","[Redacted]","c"]')
  t.is(JSON.stringify(serializers.test4(['a', 'b', {foo: ['a', 'b', 'c', {oh: 'oh'}]}])), '["a","b",{"foo":["a","b","c","[Redacted]"]}]')
  t.end()
})

test('ignores non-matching key paths', function (t) {
  var serializers = noir(['foo.shoe', 'foo.bar'])
  t.is(JSON.stringify(serializers.foo({baz: 1, bar: 'private'})), '{"baz":1,"bar":"[Redacted]"}')
  t.end()
})

test('supports wild cards', function (t) {
  var serializers = noir(['test.*', 'deep.bar.baz.ding.*', 'array[*]', 'deepArray.down.here[*]', 'insideArray.like[3].this.*'])
  t.is(JSON.stringify(serializers.test({baz: 1, bar: 'private'})), '{"baz":"[Redacted]","bar":"[Redacted]"}')
  t.is(JSON.stringify(serializers.deep({a: 1, bar: {b: 2, baz: {c: 3, ding: {d: 4, e: 5, f: 'six'}}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":{"d":"[Redacted]","e":"[Redacted]","f":"[Redacted]"}}}}')
  t.is(JSON.stringify(serializers.array(['a', 'b', 'c', 'd'])), '["[Redacted]","[Redacted]","[Redacted]","[Redacted]"]')
  t.is(JSON.stringify(serializers.deepArray({down: {here: ['a', 'b', 'c']}})), '{"down":{"here":["[Redacted]","[Redacted]","[Redacted]"]}}')
  t.is(JSON.stringify(serializers.insideArray({like: ['a', 'b', 'c', {this: {foo: 'meow'}}]})), '{"like":["a","b","c",{"this":{"foo":"[Redacted]"}}]}')
  t.end()
})

// test('wild cards overwrite primitives', function (t) {
//   var serializers = noir(['test.*', 'deep.bar.baz.ding.*', 'array[*]', 'deepArray.down.here[*]', 'insideArray.like[3].this.*'])
//   t.is(JSON.stringify(serializers.test('foo')), '"[Redacted]"')
//   t.is(JSON.stringify(serializers.deep({a: 1, bar: {b: 2, baz: {c: 3, ding: 'meow'}}})), '{"a":1,"bar":{"b":2,"baz":{"c":3,"ding":{"d":"[Redacted]","e":"[Redacted]","f":"[Redacted]"}}}}')
//   t.is(JSON.stringify(serializers.array('ooooh')), '"[Redacted]"')
//   t.is(JSON.stringify(serializers.deepArray({down: {here: 'abc'}})), '{"down":{"here":"[Redacted]"}}')
//   t.is(JSON.stringify(serializers.insideArray({like: ['a', 'b', 'c', {this: 'meow'}]})), '{"like":["a","b","c",{"this":"[Redacted]"}]}')
// })
