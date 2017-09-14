# tMysqlProiseDao

Unopinioned, high quality, future-ready mysql controller for more convenience, code reuse,
clean APIs, flexibility, reasonable conventions, maintainability, helping you to implement
an architecture, that will support you and your team and finally improve your security. That uses native Pomises 
and is ready for async/await. It supports with transactions and even distributed 
transactions with other resources. It helping you implementing best practice and follow stable conventions.
It helps you with pageing and you keep full flexibility.


## Usage

```javascript
var tMysqlDao = require('tmysqlpromisedao');
var db = tMysqlDao({
    connectionLimit: 5,
    user: 'root',
    password: '',
    database: 'dbname',
    registry: {} // optional
});
// define a dao-description
var userDao = {
    tableName: 'user',
    fields: { // fields to define the schema.
        id: { type: 'int AUTO_INCREMENT', primary: true },
        name: { type: 'varchar(255)' },
        password: { type: 'char(32)' },
        registered: { type: 'Boolean' },
        mail: { type: 'varchar(255)' },
        avatar: { type: 'int', mapTo: { tableName: 'image', foreignKey: 'id' } } // avatar is an ID mapping to a image-table
    },
    has: {
        profilePicures: { tableName: 'image', foreignKey: 'uploader', localField: 'id', multiple: true }
        //fetch neasted images, that belong to users
        // returns the images, and extend the provided users.
    },
    conditionals: {
        new: { condition: 'TO_DAYS(registered) > (TO_DAYS(NOW())-10)', multiple: true },
        // condition just the where-clause of the sql to fetch users.
    },
    queries: {
        withoutPicture: 'SELECT * FROM users WHERE id NOT IN (SELECT distinct owner FROM images)'
        // the tmysqlreader is optimal to load queries from an sql file to
        // make them available as functions, that support parameter, transactions and paging
    }
};
db.prepareDao(userDao);


async function application() {
    await userDao.createTable(); // create table if not exists
    //insert some objects
    await userDao.insert({ name: 'Dave', password: '111111', mail: 'dave@example.com', register: Date.now() });
    await userDao.insert({ name: 'Richard', password: '111111', mail: 'richard@example.com', register: Date.now() });
    await userDao.insert({ name: 'Tobias', password: '111111', mail: 'tobias@example.com', register: Date.now() });
    await userDao.insert({ name: 'Michael', password: '111111', mail: 'michael@example.com', register: Date.now() });

    //find one by Mail
    const tobias = await userDao.getOneByMail('tobias@example.com');
    console.log(tobias);
}

application();
```


## Benefit

After prepareController, the userDao will look as followed.
In fact, it is extented by many usefull methods, usefull to working on a database.
All methods support to be executed in a [transaction](#transaction).
getAll, findWhere, and getBy* methods support [paging](#paging).
The functions to request and provide the response in a node-style-callback (err, res)

```javascript

userDao = {
    // the properties defined in the template don't change
    tableName:'user',
    fields:{
    id:{primary:true},
    name:{},
    password:{},
    registered:{},
    mail:{},
    avatar:{mapTo:{tableName:'image',foreignKey:'id'}}
  },
  has: {
    screens: { tableName: 'screen', foreignKey: 'owner', localField: 'id', multiple: true }
  },

  // the database object provided by tMysqlDao
  db: db,

    // query the entire table without conditions
    getAll: function(){/*logic*/},

    // query rows with specific value on the given named column
    // the value can also be an object with that value
    getById: function(){/*logic*/},
    getByName: function(){/*logic*/},
    getByPassword: function(){/*logic*/},
    getByRegistered: function(){/*logic*/},

    // getOne* is same as getBy, but you only get the first -> need no paging
    getOneById: function(){/*logic*/},
    getOneByName: function(){/*logic*/},
    getOneByRegistered: function(){/*logic*/},
    getOneByPassword: function(){/*logic*/},

    // fetch methods query the related data from an other table.
    // they will attach the result to the given objects create plane objects if only ids have been provided
    // as a third parameter it provides the original result list. (as flatt array)
    fetchProfilePicures: function(obj){/*logic to fetch screen objects and attatch them to the given userObjects*/},
    fetchAvatar: function(obj){/* load image from ImageTable and attatch it to the user */}

    findWhere: function(){/*takes an object with props to match*/,
    findOneWhere: function(){},
    where: function(){/*takes the where-clause of a query*/},
    oneWhere: function(){},

    search: function(word,filterObj){/*fulltextSearch on all fields+filter like in where*/},

    // delete objects based on the key
    remove: function(objs){/* remove logic*/},
    // insert a single object matching the row fieldnames, extending the key if possiable
    insert: function(obj){/* executing the insert and fetch the ID*/},
    // if you changed the objects in code you can save them back and update the database
    save: function(objs){/*delete one or more objects*/},
    // save for only one by one. because updates by id only can be done one by one.
    // if you need something like "increase where" use the db.query.
    saveOne: function(obj){/*save the objects properties by the primaryKey*/},
    new: function(){/*method to get query new users*/},
    withoutPicture: function(){/*query pictures without images, also supports pageing*/}
}
```
You see, the methods follow the same structure in naming in the order of there parameter
and function. All methods can support parameter, paging, connections. When you are edding
extra methods it is appropriate to follow the same paradime, for an easy use of your
dao-API.


## Bestpractice
Following these bestpractices you will have a good structure for your application,
good support in most modern IDEs and editors and implement string conventions for
accessing resources for you and your team.

### providing database
The module is designed for nodejs. So it is good if you make a file in your project
like the following:

```javascript
var connectonConfig = require('./mysqlConfig.json');
var db = module.exports = require('tmysqlpromisedao')(connectionConfig);
```
You can already use this module to query the database, handle transactions, fetch and
manipulate data on the database. But the better way is to provide one dao-object
for each table. As you see, you can also make multiple database objects, for cases, when 
you need to manage data across multiple mysql-server. 


Then make a folder where you put file like the folliwing *userDao.js*, that look like 
that:

```javascript
var db = require('./db');
var userDao = module.exports = db.prepareDao({
    tableName:'user',
    fields:{ // fields in the table
        id:{primary:true},
        name:{},
        password:{},
        registered:{},
        mail:{},
        avatar:{mapTo:{tableName:'image', foreignKey:'id'}} // avatar is an ID mapping to a image-table
    },
    has: {
        profilePicures: { tableName: 'image', foreignKey: 'uploader', localField: 'id', multiple: true }
        // makes it possible to load all pictures uploaded by some user
    }
});

```
You can also add more methods to the dao, that you need to meet your requiremets.
but think: 
The Dao is made to access the database, not directly for the application logic.
If you relaize to repeat yourself or you have some interesting feature to extend this
tmysqlpromiseDao, it might be interesting for this framework and you can add a proposal
via issue on github.

### SQL
On the dao, you can provide many queries on the queries-key. On that property, there is
key the new method-name and the value is some SQL-statement. tmysqlpromisedao will
analyze the query to provide a function, where you can pass parameter, in the same
order as they occur in the query. For select queries you have automaticly the support
for paging and of course, in any case, transactions are supported. It is convinient 
not to write the SQL statements as a string into the queries peoperty. A perfect
solution is the [tsqlreader](https://www.npmjs.com/package/tsqlreader). It will parse
an *.sql* file and provide the queries by there name. The tsqlreader has some more
usefull features.

### Conventions
When adding new custom functions to a dao, you should follow the naming conventions,
that this framework follows. The queries on that dao should only query objects, found
on this table or maximum provide more fields by a join. methods that start with **fetch**
should query some data, extend the given objects to provide neasted objects and return a
the list of fetched objects. The methods have names, that start with a verb followed by a
subject. That means with the userDao to something with/for something else. More general methods
just provide a verb.

## Transaction

To discribe the usage of transactions I need to discribe to use transactions and 
to support transactions. All methods provided by this framework support transactions. 
That means they follow a special pattern. Note, that the model of transactions in this
framework is even ready to implement distributed transactions.


### Use Transactions

The usage of transactions is very close to the transactions of the mysql module, but
needs a step less and work seemlessly with promises. That makes writing furure javascript
code a brease.

```javascript
async function doSomethingInTransaction(){
    try{
        var connection = await db.beginTransaction();
        await db.save({id:'1',obj:'data'}, connection);
        await connection.commit();
    }catch(e){
        await connection.rollback();
    }
};
doSomethingInTransaction();
````

Internally, the db module uses the connectionpool of mysql. beginTransaction will get a
connection from that pool and start the connection. When you commit or rollback, the 
framework will also release the connection back to the pool.

### Support Transactions

You have seen, to use a method that supports transactions you pass the transaction-connection
into the method, as the last parameter. This paradime let the developer support transactions,
even if they are not used for the moment. 

To write a method that supports the transactions, you simple pass the last argument into every 
other the query methods as last argument.
```javascript
/**
 * method to increase the likecount of a user
 * @param {String} id the user to target
 * @param {Number} amount about to change the count
 * @param {Object} conneciton to supports transactions
 */
userDao.increaseById = function(id, amount, conneciton){
    return this.db.query('UPDATE ?? SET likes = likes + ? WHERE ?? = ?',[this.tableName, amount, 'id', id], connection);
};
```
You see, simple pass the connection into an other transaction supporting method. If you don't use
that transaction, the parameter will be undefined through all methods until the query method,
witch will then take a free connection from the pool.


## Paging

The base of the pageing is db.selectPaged(). witch is the query method with two additional optional parameter. page and pageSize before the optional connection. It will execute the query using db.query with a sqlString extended by a limit clouse. It will also execute the query with counting the results, an object with the result and the counts.

```javascript
userDao.getAll(0,10)
    .then(function(res){
        console.log(res)// [the 10 first userobjects]
        console.log(res.resultCount) // 199
        console.log(res.pageCount) // 20
    });
```

## Registry
In the initial configuration you have already seen the optional parameter *registry*. This is an optional feature, that will allow you to mashup data sources. By that I mean, that you can use different databases, database types, storrage systems/services, APIs together. 

You might store your users in relational database Mysql, but posts in Mongo, and you use a location service (i.e.: [OSM](https://www.openstreetmap.org/))to map the users adresses to a map. And in the same way, you *fetch* data from related tables, you could fetch data and merge it from any other resource.

## Promise

By default tmysqlpromisedao is using native promises in nodejs. If you want to use an other promise library,
you can exchange the promiseFactory on the db. Following an example with bluebird.
```javascript
var promise = require('bluebird');
var connectonConfig = require('./mysqlConfig.json');
var db = module.exports = require('tmysqlcontroller')(connectionConfig);
db.newPromise = function(handler){
    return new promise(handler);
};
```
And next an example with Q. For demonstration it uses Q.defer(). 
```javascript
var Q = require('q');
var connectonConfig = require('./mysqlConfig.json');
var db = module.exports = require('tmysqlcontroller')(connectionConfig);
db.newPromise = function(handler){
    var deferred = Q.defer();
    function resolve (res){deferred.resolve(res);}
    function reject (err){deferred.reject(err);}
    process.nextTick(function(){
        try{
            handler(resolve, reject);
        }catch(err){
            deferred.reject(err);
        }
    });
    return deferred.promise;
};
```


# Function Reference
For now check out the source at [Github/tobiasnickel/tmysqlpromisedao](https://github.com/TobiasNickel/tmysqlpromisedao). The code is not to long and documented

Tobias Nickel  

![alt text](https://avatars1.githubusercontent.com/u/4189801?s=150)
