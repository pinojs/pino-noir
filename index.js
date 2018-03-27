'use strict'

var DEFAULT_CENSOR = '[Redacted]'
var rxProp = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g

function noir (serializers, keys, censor) {
  if (Array.isArray(serializers)) {
    censor = arguments.length === 2 ? keys : DEFAULT_CENSOR
    keys = serializers
    serializers = {}
  } else if (arguments.length === 2) {
    censor = DEFAULT_CENSOR
  }

  var shape = keys.map(strToPath).reduce(function (o, p) {
    var k = p[0]
    if (!o[k]) o[k] = []
    o[k].push(p)
    return o
  }, {})

  Object.keys(shape).forEach(function (top) {
    if (shape[top].some(function (a) { return a.length === 1 })) {
      shape[top] = redact
    } else {
      shape[top].forEach(function (a) { a.shift() })
      shape[top] = factory(shape[top])
    }

    var prev = shape[top]
    var serializer = serializers[top]
    if (serializer) {
      shape[top] = function (obj) {
        var intermediate = serializer(obj)
        return prev(intermediate)
      }
    }
  })

  Object.keys(serializers).forEach(function (top) {
    if (!shape[top]) {
      shape[top] = serializers[top]
    }
  })

  return shape

  function redact () { return {toJSON: mask} }
  function mask (key) { return typeof censor === 'function' ? censor(this[key]) : censor }

  // we use eval to pre-compile the redactor function
  // this gives us up 100's of ms (per 10000ops) in some
  // cases (deep nesting, wildcards). This is certainly
  // safe in this case, there is not user input here.
  /* eslint no-eval: 0 */
  function factory (paths) {
    var redactor
    eval('redactor = function redactor (o) { return redact(o, ' + JSON.stringify(paths) + ') }')
    redact() // shh linter
    return redactor

    // redact is too big to inline,
    // can be made smaller by making unreadable,
    // but doesn't seem to improve benchmarks
    function redact (o, paths) {
      if (o == null) return o
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
      var pre
      var red
      for (; i < len; i++) {
        path = paths[i]
        pathIndex = 0
        terminus = path.length - 1
        key = path[terminus]
        cur = o
        while (cur != null && pathIndex < terminus) {
          k = path[pathIndex++]
          pre = cur
          cur = cur[k]
        }
        parent = (pathIndex && pathIndex === terminus) ? cur : o
        if (!parent) continue
        k = path[pathIndex]
        if (k === '*') {
          red = redactAll(parent, censor)
          if (red && parent === o) o = censor
          else if (red) {
            path.length = pathIndex
            set(o, path, new Redacted(val, path[pathIndex - 1], pre, censor))
          }
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
  if (typeof object !== 'object') {
    return true
  }
  Object.keys(object).reduce(function (o, k) {
    o[k] = new Redacted(o[k], k, object, censor)
    return o
  }, object)
}

// set was a hot path and bottleneck,
// had to make the function small enough
// to inline, hence the algebra.
// o = object, p = path, v = value,
// i = index, l = length, li = lastIndex,
// n = nested, k = key, nv = newValue, ov = objValue
/* eslint no-self-compare: 0, no-mixed-operators: 0 */
function set (o, p, v) {
  var i = -1
  var l = p.length
  var li = l - 1
  var n = o
  var k
  var nv
  var ov
  while (n != null && ++i < l) {
    k = p[i]
    nv = v
    ov = n[k]
    nv = (i !== li) ? ov : nv
    n[k] = (objectHasProp(n, k) && nv === ov) || nv === undefined ? n[k] : nv
    n = n[k]
  }
  return o
}

// any object created with prototype = null will crash server
// use objectHasProp to use Object hasOwnProperty method
function objectHasProp (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

function strToPath (s) {
  var result = []
  ;(s + '').replace(rxProp, function (match, number) {
    result.push(number || match)
  })
  return result
}

// the returned object is immediately JSON.stringified,
// https://github.com/mcollina/pino/blob/master/pino.js#L224-L225
// this means we can leverage the JSON.stringify loop
// print redacted, and replace with original value (cheap),
// instead of copying the object and stripping values (expensive)
// the Redacted constructor is used because it allows for
// quick triggering of hidden class optimization

function Redacted (val, key, parent, censor) {
  this.val = val
  this.key = key
  this.parent = parent
  this.censor = censor
}

Redacted.prototype.toJSON = function toJSON () {
  this.parent[this.key] = this.val
  return typeof this.censor === 'function' ? this.censor(this.val) : this.censor
}

module.exports = noir
