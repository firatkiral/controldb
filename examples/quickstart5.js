const controldb = require('../src/controldb.js');

var db = new controldb("quickstart5.db");

var userSchema = {
  name: "String",
  age: { type: "Number", required: true, min: 1, max: 100, default: 30 },
  god: { type: "Boolean", default: false },
  number: { type: "Number", default: 1, required: true },
  powers: {
    type: "Object",
    schema: {
      air: "Boolean",
      fire: "String",
      water: {
        type: "Number",
        min: 20,
        max: 50,
        required: true
      }
    }
  }
};

var users = db.addCollection("users", { unique: ["name"], schema: userSchema });

try {
  users.insert({ name: "mimir", age: 66 });
} catch (error) {
  console.log(error.message);
}

users.insert({ name: "mimira", powers: { air: true, fire: "hot", water: 30 } });

let mim = users.findOne({ name: "mimira" });
mim.powers.water = 40;
users.update(mim);

try {
  mim.number = undefined;
  let res = users.update(mim);
  console.log(res);
} catch (error) {
  console.log(error.message);
}

console.log(users.docs());
