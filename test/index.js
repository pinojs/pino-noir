var test = require('tap').test
var noir = require('../')
var defaultCensor = '[Redacted]'

test('redacts top level keys', function (t) {
  var serializers = noir(['test1', 'test2'])
  t.is(JSON.stringify(serializers.test1({})), '"' + defaultCensor + '"')
  t.is(JSON.stringify(serializers.test2({})), '"' + defaultCensor + '"')
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
  var serializers = noir(['test1.test', 'test2.test3.test4'])
  t.is(JSON.stringify(serializers.test1({test: 'test', a: 1})), '{"test":"' + defaultCensor + '","a":1}')
  t.is(JSON.stringify(serializers.test2({test3: {test4: 'test', b: 2}, a: 1})), '{"test3":{"test4":"' + defaultCensor + '","b":2},"a":1}')
  t.end()
})

test('ignores non-matching key paths', function (t) {
  var serializers = noir(['foo.shoe', 'foo.bar'])
  t.is(JSON.stringify(serializers.foo({baz: 1, bar: 'private'})), '{"baz":1,"bar":"[Redacted]"}')
  t.end()
})

// test('supports wild card key paths', function (t) {
//   var serialize = noir(['foo.*'])
//   var intermediate = serialize({foo: {baz: 1, bar: 'private'}})
//   t.is(JSON.stringify(intermediate), '{"foo":{"baz":"[Redacted]","bar":"[Redacted]"}}')
//   t.end()
// })
