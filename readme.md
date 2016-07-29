# pino-noir

## API

```js
noir(['key', 'path.to.key', 'path.to[0].key']) => (obj) => filteredObj
```

## Usage

```js
var pino = require('pino')({
  serializers: require('pino-noir')(['key', 'paths'])
})
```
