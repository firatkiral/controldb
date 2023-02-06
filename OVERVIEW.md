# ControlDB

[ControlDB GitHub page](https://github.com/firatkiral/controldb) | 
[Sandbox / Playground](https://rawgit.com/firatkiral/controldb/master/examples/sandbox/ControlSandbox.htm)

## Documentation Overview

This is an early effort to provide a more accurate and up-to-date version of ControlDB documentation by using jsdoc.  Since modifications arise from various contributors, this should allow distributed effort toward 
maintaining this documentation.  

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