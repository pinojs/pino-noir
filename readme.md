# pino-noir

Redact sensitive information from your pino logs.

🍾🍷

[![codecov](https://codecov.io/gh/pinojs/pino-noir/branch/master/graph/badge.svg)](https://codecov.io/gh/pinojs/pino-noir)

## API

```js
noir([serializers = {}], paths = [], censor = '[Redacted]') => {Pino Serializer Object}
```
### `paths`

The `paths` parameter should be an array of strings, describing the nested location of a key in an object.

The path can be represented in dot notation, `a.b.c`, and/or bracket notation
`a[b[c]]`, `a.b[c]`, `a[b].c`.

Paths also supports the asterisk wildcard (`*`) to redact all keys within
an object. For instance `a.b.*` applied to the object `{a: b: {c: 'foo', d: 'bar'}}` will result in the redaction of properties `c` and `d` in that object (`{"a": "b": {"c": "[Redacted]", "d": "[Redacted]"}}`).

### `censor`

The `censor` can be of any type, for instance an object like `{redacted: true}`
is allowed, as is `null`. Explicitly passing `undefined` as the `censor` will
in most cases cause the property to be stripped from the object. Edge cases occur when an array key is redacted, in which case `null` will appear in the array (this is ultimately a nuance of `JSON.stringify`, try `JSON.stringify(['a', undefined, 'c'])`)

`censor` can also accept a function. This is helpful in cases where you want to redact dynamically instead of a fixed value. A common use case could be to mask partially (e.g. `{ test: 1234567890 }` => `{ "test": "xxxxxx7890" }`). Check the tests to see this in action.

### `serializers` (optional)

An object containing a previous
[serializers](https://github.com/pinojs/pino/blob/master/docs/API.md#example) object. The output of those
serializers will be redacted. In this way it is possible to chain
standard serializers with pino-noir.

## Example

```js
var noir = require('pino-noir')

var redaction = noir([
  'key', 'path.to.key', 'path.leading.to.another.key', 'check.*', 'also[*]'
], 'Ssshh!')

var pino = require('pino')({
  serializers: redaction
})

pino.info({
  key: 'will be redacted',
  path: {
    to: {key: 'sensitive', another: 'thing'},
    leading: {to: {another: {key: 'wow'}}}
  },
  check: {out: 'the', wildards: 'yo!'},
  also: ['works', {with: 'arrays'}]
})
// {"pid":89590,"hostname":"x","level":30,"time":1475104592035,"key":"Ssshh!","path":{"to":{"key":"Ssshh!","another":"thing"},"leading":{"to":{"another":{"key":"Ssshh!"}}}},"check":{"out":"Ssshh!","wildards":"Ssshh!"},"also":["Ssshh!","Ssshh!"],"v":1}

var redaction2 = noir(['key'], (val) => 'was ' + val.substr(-8))

var pino2 = require('pino')({
  serializers: redaction2
})

pino2.info({
  key: 'will be redacted'
})
// {"pid":89590,"hostname":"x","level":30,"time":1475104592035,{"key":"was redacted"},"v":1}
```

## Pino Web Loggers

Pino-noir is also directly compatible with [hapi-pino](http://npm.im/hapi-pino), [express-pino-logger](http://npm.im/express-pino-logger), [koa-pino-logger](http://npm.im/koa-pino-logger), [restify-pino-logger](http://npm.im/restify-pino-logger).

In each case, use the same `serializers` option as with `pino`.

For instance, with `express-pino-logger`:

```js
var express = require('express')
var noir = require('pino-noir')
var app = express()
app.use(require('express-pino-logger')({
  serializers: noir(['key', 'path.to.key', 'check.*', 'also[*]'], 'Ssshh!')
}))
```

Another example, with Hapi:

```js
const Hapi = require('hapi')
const noir = require('pino-noir')
const server = new Hapi.Server()
server.register({
  register: require('hapi-pino'),
  options: {
    serializers: noir(['key', 'path.to.key', 'check.*', 'also[*]'], 'Ssshh!')
  }
}, (err) => { /* etc. */ })
```

## Benchmarks

Overhead in benchmarks ranges from 0% to 20% depending on the case.

```
benchPinoTopLevel*10000: 293.869ms
benchNoirTopLevel*10000: 367.033ms
benchPinoNested*10000: 463.412ms
benchNoirNested*10000: 441.725ms
benchPinoDeepNested*10000: 599.449ms
benchNoirDeepNested*10000: 519.669ms
benchPinoVeryDeepNested*10000: 569.447ms
benchNoirVeryDeepNested*10000: 638.181ms
benchPinoWildcardStructure*10000: 538.458ms
benchNoirWildcards*10000: 624.209ms
benchPinoFunctionCensor*10000: 375.109ms
benchNoirFunctionCensor*10000: 462.107ms
```

In these benchmarks, redacting top level keys adds no overhead to logging, redacting using wildcards in a deep nested structure adds 20% overhead.

Redacting various nested structures adds between 8-13% overhead.

Other benchmark runs showed (roughly speaking) deviation of around ±3%.

## Acknowledgements

* Sponsored by [nearForm](http://nearform.com)
* [Emily Rose](https://twitter.com/nexxylove) for inspiration on the name and idea

## License

MIT
