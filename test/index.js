var test = require('tap').test
var noir = require('../')

test('returns a serializer function', function (t) {
  t.is(typeof noir(), 'function')
  t.end()
})

test('serializer function returns an object with keys redacted', function (t) {
  var serialize = noir(['bing', 'foo.bar'])
  var intermediate = serialize({foo: {baz: 1, bar: 'private'}, bing: 'redact me'})
  t.is(JSON.stringify(intermediate), '{"foo":{"baz":1,"bar":"[Redacted]"},"bing":"[Redacted]"}')
  t.end()
})

test('ignores non-matching key paths', function (t) {
  var serialize = noir(['foo.shoe', 'foo.bar'])
  var intermediate = serialize({foo: {baz: 1, bar: 'private'}})
  t.is(JSON.stringify(intermediate), '{"foo":{"baz":1,"bar":"[Redacted]"}}')
  t.end()
})

test('supports wild card key paths', function (t) {
  var serialize = noir(['foo.*'])
  var intermediate = serialize({foo: {baz: 1, bar: 'private'}})
  t.is(JSON.stringify(intermediate), '{"foo":{"baz":"[Redacted]","bar":"[Redacted]"}}')
  t.end()
})
