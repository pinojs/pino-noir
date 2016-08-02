'use strict'
var group = require('lodash.groupBy')
var DEFAULT_CENSOR = '[Redacted]'
var rxProp = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g
var rxEsc = /\\(\\)?/g
var reIsUint = /^(?:0|[1-9]\d*)$/

function noir (keys, censor) {
  if (arguments.length < 2) {
    censor = DEFAULT_CENSOR
  }

  var shape = group(keys.map(strToPath), function (p) {
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

  /*eslint no-labels: 0*/
  function factory (paths) {
    return function redactor (o) {
      var i = 0
      var len = paths.length
      var path
      var val
      var key
      var k
      var parent
      var pathIndex
      var terminus
      var cur
      outer:
      for (; i < len; i++) {
        path = paths[i]
        pathIndex = 0
        terminus = path.length - 1
        key = path[terminus]
        cur = o
        while (cur != null && pathIndex < terminus) {
          k = path[pathIndex++]
          if (k === '*') {
            redactAll(cur, censor)
            continue outer
          }
          cur = cur[k]
        }
        parent = (pathIndex && pathIndex === terminus) ? cur : o
        k = path[pathIndex]
        if (k === '*') {
          redactAll(parent, censor)
          continue
        }
        val = parent[k]
        if (val === undefined) { continue }
        set(o, path, new Redacted(val, key, parent, censor))
      }
      return o
    }
  }
}

function redactAll (object, censor) {
  if (object == null) return
  Object.keys(object).reduce(function (o, k) {
    o[k] = new Redacted(o[k], k, object, censor)
    return o
  }, object)
}

/*eslint no-self-compare: 0*/
function set (object, path, value) {
  var index = -1
  var length = path.length
  var lastIndex = length - 1
  var nested = object
  var key
  var type
  var isObject
  var newValue
  var objValue
  var nxt
  var assign
  while (nested != null && ++index < length) {
    key = path[index]
    type = typeof nested
    isObject = !!nested && (type === 'object' || type === 'function')
    if (isObject) {
      newValue = value
      if (index !== lastIndex) {
        objValue = nested[key]
        nxt = path[index + 1]
        newValue = objValue == null
          ? (typeof nxt === 'number' || reIsUint.test(nxt)) && (nxt > -1 && nxt % 1 === 0) ? [] : {}
          : objValue
      }
      objValue = nested[key]
      assign = !(
        nested.hasOwnProperty(key) &&
        newValue === objValue || (newValue !== newValue && objValue !== objValue) ||
          newValue === undefined && !(key in nested)
      )
      if (assign) { nested[key] = newValue }
    }
    nested = nested[key]
  }
  return object
}

function strToPath (s) {
  var result = []
  ;(s + '').replace(rxProp, function (match, number, quote, s) {
    result.push(quote ? s.replace(rxEsc, '$1') : (number || match))
  })
  return result
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

