# pino-noir

## API

```js
noir(['key', 'path.to.key', 'path.to.another[0].key'], censor = '[Redacted]') => {Serializer Object}
```

## Usage

```js
var pino = require('pino')({
  serializers: require('pino-noir')(['key', 'path.to.key'], 'Ssshh!')
})

pino.info({key: 'will be redacted', path: {to: {key: 'sensitive', another: 'thing'}}})
// => {"pid":51380,"hostname":"MacBook-Pro-4.local","level":30,"time":1469841565205,"key":"Ssshh!","path":{"to":{"key":"Ssshh!","another":"thing"}},"v":1}
```
