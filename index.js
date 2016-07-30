var get = require('lodash.get')
var set = require('lodash.set')
var toPath = require('lodash.topath')
var group = require('lodash.groupBy')
var defaultCensor = '[Redacted]'

function noir (keys, censor) {
  if (typeof censor === 'undefined') {
    censor = defaultCensor
  }

  var shape = group(keys.map(toPath), function (p) {
    return p[0]
  })
  var tops = Object.keys(shape)
  for (var i = 0; i < tops.length; i++) {
    if (shape[tops[i]].some(function (a) { return a.length === 1 })) {
      shape[tops[i]] = redact
      continue
    }
    shape[tops[i]].forEach(function (a) { a.shift() })
    shape[tops[i]] = factory(shape[tops[i]])
  }
  return shape

  function redact () { return {toJSON: mask} }
  function mask () { return censor }

  // the returned object is immediately JSON.stringified,
  // https://github.com/mcollina/pino/blob/master/pino.js#L224-L225
  // this means we can leverage the JSON.stringify loop
  // print redacted, and replace with original value (cheap),
  // instead of copying the object and stripping values (expensive)
  // the Redacted constructor is used because it allows for
  // quick triggering of hidden class optimization

  function factory (paths) {
    return function redactor (o) {
      var i = 0
      var len = paths.length
      var r
      var path
      var val
      var key
      var parent
      for (; i < len; i++) {
        path = paths[i]
        val = get(o, path)
        if (val === undefined) { continue }
        key = path[path.length - 1]
        path.length -= 1
        parent = get(o, path) || o
        r = new Redacted(val, key, parent, censor)
        path[path.length] = key
        set(o, path, r)
      }
      return o
    }
  }
}

function Redacted (val, key, parent, censor) {
  this.val = val
  this.key = key
  this.parent = parent
  this.censor = censor
}

Redacted.prototype.toJSON = function toJSON () {
  this.parent[this.key] = this.val
  return this.censor
}

module.exports = noir

