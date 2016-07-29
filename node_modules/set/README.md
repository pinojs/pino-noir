# Set.js
[![Build Status](https://travis-ci.org/gkatsev/set.js.png?branch=master)](https://travis-ci.org/gkatsev/set.js)
[![Dependency Status](https://david-dm.org/gkatsev/set.js.png)](https://david-dm.org/gkatsev/set.js)
[![devDependency Status](https://david-dm.org/gkatsev/set.js/dev-status.png)](https://david-dm.org/gkatsev/set.js#info=devDependencies)
[![NPM](https://nodei.co/npm/set.png)](https://nodei.co/npm/set/)

## Usage

Create an array of items and then pass it to Set.
`var Set = require('./set')`
`var set = new Set([0,1,1])`
And then when we get it
`set.get() // [0,1]`

### Note on input types
This module casts inputs into strings. Objects and Arrays are turned into JSON with `JSON.stringify`.
This makes this module fairly simple as it doesn't allow complex objects to be stored. However, given that Objects and Arrays are now JSONified, these objects can now be compared according to their JSON output. To make two objects unique, give them a different output for their `toJSON` method.

In a future version, this module would use a javascript Set as the datastructure and therefore won't have this limitation, but Sets are quite ready yet.

## API
There are various Set functions available

### Static functions
* `Set#unique` given an array, return an array with all duplicates removed.

### Instance functions
* `Set#contains` return whether a given property is available.
* `Set#empty` return whether the set in empty.
* `Set#size` return the size of the Set.
* `Set#get` return the set as an Array.

* `Set#add` add an item to the Set.
* `Set#remove` remove an item from the set.
* `Set#clear` remove all items from the set.

* `Set#union` return a new set that is the union of the set with another one.
* `Set#intersect` return a new set that is the intersection of the set with another one.
* `Set#difference` return a new set that is the difference of the set with another one.

* `Set#find` return an array with all items that match the predicate.

## License

The MIT License (MIT)

Copyright (c) 2011 George "Gary" Katsevman

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
