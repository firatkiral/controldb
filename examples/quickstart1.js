// quickstart1.js example : 
// This exmple does not save the database at all but just uses control as an in-memory database with no persistence.
// Since control is synchronous -except- when dealing with persistence (I/O), 
//   and this database uses no persistence, this example can deal with control entirely synchronously.

const control = require('../src/controldb.js');

var db = new control("quickstart1.db");
var users = db.addCollection("users");

users.insert({name:'odin', age: 50});
users.insert({name:'thor', age: 35});

var result = users.find({ age : { $lte: 35 } });

// dumps array with 1 doc (thor) to console
console.log(result);
