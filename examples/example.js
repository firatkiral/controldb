window.runExample = function () {
    try {
        // firefox needs these helper functions defined before they are used
        function sep() {
            trace('//---------------------------------------------//');
        }

        function trace(message) {
            if (typeof console !== 'undefined' && console.log) {
                console.log(message);
            }
        }

        // init db

        var db = new controldb('Example', {
            verbose: true,
            autosave: true,
            autosaveInterval: 5000
        });


        // create two example collections
        var users = db.addCollection('users', ['email'], true, false);
        var projects = db.addCollection('projects', ['name']);

        // show collections in db
        db.listCollections();

        trace('Adding 9 users');

        // create six users
        var odin = users.insert({
            name: 'odin',
            email: 'odin.soap@controldb.org',
            age: 38
        });
        var thor = users.insert({
            name: 'thor',
            email: 'thor.soap@controldb.org',
            age: 25
        });
        var stan = users.insert({
            name: 'stan',
            email: 'stan.soap@controldb.org',
            age: 29
        });
        // we create a snapshot of the db here so that we can see the difference
        // between the current state of the db and after the json has been reloaded
        var json = db.serialize();


        var oliver = users.insert({
            name: 'oliver',
            email: 'oliver.soap@controldb.org',
            age: 31
        });
        var hector = users.insert({
            name: 'hector',
            email: 'hector.soap@controldb.org',
            age: 15
        });
        var achilles = users.insert({
            name: 'achilles',
            email: 'achilles.soap@controldb.org',
            age: 31
        });
        var lugh = users.insert({
            name: 'lugh',
            email: 'lugh.soap@controldb.org',
            age: 31
        });
        var nuada = users.insert({
            name: 'nuada',
            email: 'nuada.soap@controldb.org',
            age: 31
        });
        var cuchullain = users.insert({
            name: 'cuchullain',
            email: 'cuchullain.soap@controldb.org',
            age: 31
        });

        trace('Finished adding users');

        trace('--- test regexp--------------');
        trace(users.find({
            name: {
                '$regex': /in/
            }
        }));
        trace('--- test regexp finished-----');
        // create an example project
        var prj = projects.insert({
            name: 'ControlDB',
            owner: stan,
            tags: ['critical', 'public']
        });

        // query for user
        //trace( users.find('name','odin') );



        stan.name = 'Stan Laurel';

        // update object (this really only syncs the index)
        users.update(stan);
        users.remove(achilles);

        // finding users with age greater than 25
        trace('Find by age > 25');
        trace(users.find({
            'age': {
                '$gt': 25
            }
        }));
        trace('Get all users');
        trace(users.find());
        trace('Get all users with age equal to 25');
        trace(users.find({
            'age': 25
        }));
        // get by id with binary search index
        trace(users.get(8));

        // a simple filter for users over 30
        function ageView(obj) {
                return obj.age > 30;
            }
            // a little more complicated, users with names longer than 3 characters and age over 30
        function aCustomFilter(obj) {
            return obj.name.length < 5 && obj.age > 30;
        }



        // test the filters
        trace('Example: where test');
        trace(users.where(function (obj) {
            return obj.age > 30;
        }));
        
        trace('Example: $contains and $containsAny');
        trace(projects.find({
            'tags': {
                '$contains': [ 'critical', 'top secret' ]
            }
        }));
        trace(projects.find({
            'tags': {
                '$containsAny': [ 'critical', 'top secret' ]
            }
        }));
        trace('End view test');
        sep();

        trace('Example: Custom filter test');
        trace(users.where(aCustomFilter));
        trace('End of custom filter');
        sep();

        // example of map reduce
        trace('Example: Map-reduce');

        function mapFun(obj) {
            return obj.age;
        }

        function reduceFun(array) {
            var len = array.length >>> 0;
            var i = len;
            var cumulator = 0;
            while (i--) {
                cumulator += array[i];
            }
            return cumulator / len;
        }

        trace('Average age is : ' + users.mapReduce(mapFun, reduceFun).toFixed(2));
        trace('End of map-reduce');
        sep();

        trace('Example: stringify');
        trace('String representation : ' + db.serialize());
        trace('End stringify example');
        sep();

        trace('Example: findAndUpdate');

        function updateAge(obj) {
            obj.age *= 2;
            return obj;
        }
        users.findAndUpdate(ageView, updateAge);
        trace(users.find());
        trace('End findAndUpdate example');

        // revert ages back for future tests
        function revertAge(obj) {
            obj.age /= 2;
            return obj;
        }
        users.findAndUpdate(ageView, revertAge);

        // test chain() operations via resultset
        sep();
        trace('Example: Resultset chained operations');
        // get users over 25 with substring 'in' in the name 
        // docs() ends the chain and returns docs[]
        // the where() function is a renamed equivalent to previous view() function
        trace(
            users
            .find({
                'age': {
                    '$gt': 25
                }
            })
            .where(function (obj) {
                return obj.name.indexOf("in") != -1
            })
            .simplesort("age")
            .docs()
        );

        sep();
        trace('Example: DynamicView');

        // Create DynamicView and apply filter (these two could have been chained together)
        var dynView = users.addDynamicView("over30users");
        dynView.applyFind({
            'age': {
                '$gt': 30
            }
        });
        // .applyWhere() can also be used to apply a user supplied filter function

        trace("Number of over 30 users : " + dynView.docs().length);
        lugh.age = 29;
        console.log(lugh);
        users.update(lugh);
        trace("Number of over 30 users : " + dynView.docs().length);

        sep();
        trace("Example : Simple Sort");

        // sort by age, true is optional second param which will sort descending
        // we are allowed one sort which can be either simple (as below) 
        dynView.applySimpleSort("age", true);
        trace(dynView.docs());

        sep();
        trace("Example : Sort via compare function");

        // change the sort by setting a new one in which we will supply the compareFun.
        // sort be name ascending...
        dynView.applySort(function (obj1, obj2) {
            if (obj1.name == obj2.name) return 0;
            if (obj1.name > obj2.name) return 1;
            if (obj1.name < obj2.name) return -1;
        });
        trace(dynView.docs());

        sep();
        trace("Example : Persistent DynamicView")

        // removing a dynamic view for demonstration purposes only.
        // you can have as many dynamic views as memory allows
        users.removeDynamicView("over30users");

        // Create a persistent dynamic view (second param indicates persistent)
        var dynViewPersistent = users.addDynamicView("over20users", {persistent: true});
        dynViewPersistent.applyFind({
            'age': {
                '$gt': 20
            }
        });
        dynViewPersistent.applySimpleSort("age");
        trace(dynViewPersistent.docs());

        // user should use docs() but let's monitor persistent docs array 
        trace("Internal persistent docs array length : " +
            dynViewPersistent.resultdata.length);

        // let's also verify it matches the internal resultset filtered rows
        trace("Internal resultset filteredrows array length : " +
            dynViewPersistent.resultset.filteredrows.length);

        sep();
        trace("Example : resultset copy/forking");

        // applied filters are permanent, so use copy to fork query
        var clonedResults = dynViewPersistent.resultset.copy();
        clonedResults.where(function (obj) {
            return obj.name.indexOf("in") != -1
        });
        trace("forked query result count : " + clonedResults.docs().length);
        trace("original result count : " + dynViewPersistent.docs().length);

        sep();
        trace("Example : offset/limit");
        trace(dynViewPersistent.resultset.offset(2).limit(4).docs());

        sep();

        db.loadJSON(json);

        trace(db.serialize());

        db.saveDatabase(function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Database saved successfully");
            }
        })

    } catch (err) {
        console.error(err);
        console.log(err.message);
    }

};
