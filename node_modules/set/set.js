/* The MIT License (MIT)

Copyright (c) 2011-2012 George "Gary" Katsevman

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE S
OFTWARE.
*/

var Set = function () {

var value = true
  , jsonify = function (item) {
     if (typeof item === "object") {
       return item = JSON.stringify(item)
     }
     return item;
  }
  , unique = function(iset){
      var set = Object.create(null)
        , i = 0
        , l = iset.length

      for(; i < l; i++) {
        set[jsonify(iset[i])] = value
      }

      return set
  }

var Set = function(input){
  this._set = unique(input || [])
}

Set.prototype.contains = function(prop){
  return !!this._set[jsonify(prop)]
}

Set.prototype.empty = function(){
  return Object.keys(this._set).length == 0
}

Set.prototype.size = function(){
  return Object.keys(this._set).length
}

Set.prototype.get = function(){
  return Object.keys(this._set)
}

Set.prototype.add = function(prop){
  this._set[jsonify(prop)] = value
}

Set.prototype.remove = function(prop){
  delete this._set[jsonify(prop)]
}

Set.prototype.union = function(iset){
  return new Set(this.get().concat(iset.get()))
}


Set.prototype.intersect = function(iset){
  var items = iset.get()
    , i = 0
    , l = items.length
    , oset = new Set()
    , prop

  for(; i < l; i++){
    prop = items[i]
    if(this.contains(prop)){
      oset.add(prop)
    }
  }

  items = this.get()

  for(i = 0, l = items.length; i < l; i++){
    prop = items[i]
    if(iset.contains(prop)){
      oset.add(prop)
    }
  }

  return oset
}

Set.prototype.difference = function(iset){
  var items = iset.get()
    , i = 0
    , l = items.length
    , oset = this.union(iset)
    , prop

  for(; i < l; i++){
    prop = items[i]
    if(this.contains(prop)){
      oset.remove(prop)
    }
  }

  return oset
}

Set.prototype.subset = function(iset){
  var items = iset.get()
    , subset = false
    , i = 0
    , l = items.length

  for(; i < l; i++){
    prop = items[i]
    if(this.contains(prop)){
      subset = true
    }
    else{
      subset = false
      break
    }
  }

  return subset
}

Set.prototype.find = function(pred){
  return this.get().filter(pred)
}

Set.prototype.clear = function(){
  this._set = Object.create(null)
}

Set.unique = function(iset){
  return Object.keys(unique(iset))
}

return Set

}()

if(typeof module === 'object' && module.hasOwnProperty('exports')){
  module.exports = Set;
}
