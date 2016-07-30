var pino = require('pino')({
  serializers: require('./')(['key', 'path.to.key'], 'Ssshh!')
})

pino.info({key: 'will be redacted', path: {to: {key: 'sensitive', another: 'thing'}}})
