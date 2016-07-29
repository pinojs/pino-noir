var get = require('lodash.get')
var set = require('lodash.set')
var toPath = require('lodash.topath')

function makeFilter (keys) {
  return function filterSerializer (o) {
    var i = 0
    var len = keys.length
    var r
    var path
    var val
    var key
    var parent
    for (; i < len; i++) {
      path = toPath(keys[i])
      val = get(o, path)
      if (val === undefined) { continue }
      key = path[path.length - 1]
      path.length -= 1
      parent = get(o, path) || o
      r = new Redacted(val, key, parent)
      path[path.length] = key
      set(o, path, r)
    }
    return o
  }
}

// the returned object is immediately JSON.stringified,
// https://github.com/mcollina/pino/blob/master/pino.js#L224-L225
// this means we can leverage the JSON.stringify loop
// print redacted, and replace with original value (cheap),
// instead of copying the object and stripping values (expensive)
// the Redacted constructor is used because it allows for
// quick triggering of hidden class optimization

function Redacted (val, key, parent) {
  this.val = val
  this.key = key
  this.parent = parent
}

Redacted.prototype.toJSON = function toJSON () {
  this.parent[this.k] = this.val
  return '[Redacted]'
}

module.exports = makeFilter

