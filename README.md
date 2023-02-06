# ControlDB

The super fast in-memory javascript document oriented database.

This is a fork of [LokiJS](https://github.com/techfort/LokiJS). The goal is to make the API more consistent and easier to use. 

- Chainable methods added to the Collection class like find, where, update, remove, etc.
- Some default behaviors changed like cloning objects on insert and update as default.
- Schema validation added to define a schema for a collection and validate documents on insert and update.

## Overview

ControlDB is a document oriented database written in javascript, published under MIT License.
Its purpose is to store javascript objects as documents in a nosql fashion and retrieve them with a similar mechanism.
Runs in node (including cordova/phonegap and node-webkit), nativescript and the browser.
ControlDB is ideal for the following scenarios: 

1. client-side in-memory db is ideal (e.g., a session store)
2. performance critical applications
3. cordova/phonegap mobile apps where you can leverage the power of javascript and avoid interacting with native databases
4. data sets loaded into a browser page and synchronised at the end of the work session
5. node-webkit desktop apps
6. nativescript mobile apps that mix the power and ubiquity of javascript with native performance and ui

ControlDB supports indexing and views and achieves high-performance through maintaining unique and binary indexes (indices) for data.

## Main Features

1. Fast performance NoSQL in-memory database, collections with unique index (1.1M ops/s) and binary-index (500k ops/s)
2. Runs in multiple environments (browser, node, nativescript)
3. Dynamic Views for fast access of data subsets
4. Built-in persistence adapters, and the ability to support user-defined ones
5. Changes API
6. Joins

## Documentation

Example usage and API documentation can be found in the [here](https://firatkiral.github.io/controldb/)


## Installation

For browser environments you simply need the controldb.js file contained in src/

For node and nativescript environments you can install through `npm install controldb`.


## Getting Started

Creating a database :

```javascript
var db = new controldb('example.db');
```

Add a collection :

```javascript
var users = db.addCollection('users');
```

Insert documents :

```javascript
users.insert({
	name: 'Odin',
	age: 50,
	address: 'Asgard'
});

// alternatively, insert array of documents
users.insert([{ name: 'Thor', age: 35}, { name: 'Control', age: 30}]);
```

Simple find query :

```javascript
var results = users.find({ age: {'$gte': 35} });

var odin = users.findOne({ name:'Odin' });
```

Simple where query :

```javascript
var results = users.where(function(obj) {
	return (obj.age >= 35);
});
```

Simple Chaining :

```javascript
var results = users.find({ age: {'$gte': 35} }).simplesort('name').docs();
```

Simple named transform :

```javascript
users.addTransform('progeny', [
  {
    type: 'find',
    value: {
      'age': {'$lte': 40}
    }
  }
]);

var results = users.chain('progeny').docs();
```

Simple Dynamic View :

```javascript
var pview = users.addDynamicView('progeny');

pview.applyFind({
	'age': {'$lte': 40}
});

pview.applySimpleSort('name');

var results = pview.docs();
```

Schema Validation :

```javascript
var userSchema = {
  name: {
    type: String,
    required: true
  },
  age: Number,
};

var users = db.addCollection('users', {schema: userSchema});

users.insert({
  name: 'Odin',
  age: "50",
});
// Error: age: input must be of type Number.

```

## Demo

The following demos are available:
- [Sandbox / Playground](https://rawgit.com/firatkiral/controldb/master/examples/sandbox/ControlDBSandbox.htm)


## License

Copyright (c) 2023 Firat Kiral

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

