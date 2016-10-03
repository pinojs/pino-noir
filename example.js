var noir = require('./')

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
// {"pid":79709,"hostname":"x","level":30,"time":1475083769896,"key":"Ssshh!","path":{"to":{"key":"Ssshh!","another":"thing"}},"check":{"out":"Ssshh!","wildards":"Ssshh!"},"also":["Ssshh!","Ssshh!"],"v":1}
