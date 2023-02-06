const controldb = require('../src/controldb.js');

var db = new controldb("quickstart5.db");

var userSchema = {
  name: String,
  age: { type: Number, required: true, min: 1, max: 100, default: 30 },
  god: { type: Boolean, default: false },
  powers: {
    type: Object, 
    properties: {
      air: Boolean,
      fire: String,
      water: {
        type: Number,
        min: 20,
        max: 50,
        required: true
      }
    }
  }
};

var users = db.addCollection("users", { unique: ["name"], schema: userSchema });

users.insert({ name: "mimir", age: 66 });
users.insert({ name: "mimira", powers: { air: true, fire: "hot", water: 30 } });

let mim = users.findOne({ name: "mimira" });
mim.powers.water = 40;
users.update(mim);

console.log(users.docs());
