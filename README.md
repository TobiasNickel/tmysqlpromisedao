# tMysqlProiseDao
unopinioned mysql controller for more convenience. That is uses native Pomises and is ready for async await.

## usage
```javascript
//require the module
var tMysqlDao = require('tmysqlpromisedao');
// create a database object.
var db = tMysqlDao({
	connectionLimit: 5,
	user: 'root',
	password: '',
	database: 'dbname'
});
// define a controller Template
var userDao = {
	tableName:'user',
	fields:{ // fields in the table
		id:{type:"int AUTO_INCREMENT",primary:true},
		name:{type:'varchar(255)'},
		password:{type:'char(32)'},
		registered:{type:'Boolean'},
		mail:{type:'varchar(255)'},
		avatar:{type:'int', mapTo:{tableName:'image',foreignKey:'id'}} // avatar is an ID mapping to a image-table
	},
	has: {
    profilePicures: { tableName: 'image', foreignKey: 'uploader', localField: 'id', multiple: true }
    // makes it possible to load all pictures uploaded by some user
  }
}
db.prepareController(userDao);


async function test(){
	await userDao.createTable();// create table if not exists
	//insert some objects
	await userDao.insert({name:'Dave',password:'111111',mail:'dave@example.com',register: Date.now()});
	await userDao.insert({name:'Richard',password:'111111',mail:'richard@example.com'register: Date.now()});
	await userDao.insert({name:'Tobias',password:'111111',mail:'tobias@example.com'register: Date.now()});
	await userDao.insert({name:'Michael',password:'111111',mail:'michael@example.com'register: Date.now()});

	//find one by Mail
	var tobias = await userDao.getOneByMail('tobias@example.com');
	console.log(tobias);
}

test();
```

## benefit

After prepareController, the userDao will look as followed.
Actually it is extented by many usefull methods usually needed working on a database.
All methods support to be executed in a [transaction](#transaction).
getAll, findWhere, and getBy* methods support  [paging](#paging).
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
	fetchScreen: function(obj){/*logic to fetch screen objects and attatch them to the given userObjects*/},
	fetchAvatar: function(obj){/* load image from ImageTable and attatch it to the user */}

	// delete objects based on the key
	remove: function(objs){/* remove logic*/};
	// insert a single object matching the row fieldnames, extending the key if possiable
	insert: function(obj){/* executing the insert and fetch the ID*/},
	// if you changed the objects in code you can save them back and update the database
	save: function(objs){/*delete one or more objects*/}
	// save for only one by one. because updates by id only can be done one by one.
	// if you need something like "increase where" use the db.query.
	saveOne: function(obj){/*save the objects properties by the primaryKey*/}
}

```
## bestpractice
The module is designed for nodejs. so it is good if you make a file in your project as followed:
```javascript
var connectonConfig = require("./mysqlConfig.json");
module.exports = require("tmysqlcontroller")(connectionConfig);
```
And then make a folder with your controllers that look like that:
```javascript
var db = require("./db");
var userDao = module.exports = db.prepareController({
	tableName:'user',
	fields:{ // fields in the table
		id:{primary:true},
		name:{},
		password:{},
		registered:{},
		mail:{},
		avatar:{mapTo:{tableName:'image',foreignKey:'id'}} // avatar is an ID mapping to a image-table
	},
	has: {
        profilePicures: { tableName: 'image', foreignKey: 'uploader', localField: 'id', multiple: true }
        // makes it possible to load all pictures uploaded by some user
    }
});

// your further methods to handle this table.
// if you relaize to repeat yourself, it might be interesting for this framework

```

## transaction
To discribe the usage of transactions I need to discribe to use transactions and to support transactions.
All methods provided by this framework support transactions. That means they follow a special pattern.

### use transactions
The usage of transactions is very close to the transactions of the mysql module, but needs one step less.

```javascript
async function doSomethingInTransaction(){
	try{
		var connection = await db.beginTransaction();
		db.save({id:"1",obj:"data"},connection);
		await connection.commit();
	}catch(e){
		await connection.rollback();
	}
};
doSomethingInTransaction();
````
The db module internally uses the connectionpool of mysql. beginTransaction will get a connection from that pool and start the connection. When you commit or rollback, the framework will also release the connection back to the pool.

### support transactions
You have seen, to use a method that supports transactions you pass the transaction-connection into the method, after the callback. This paradime makes let the developer of a method prepare the response for direct on the callback without if there is a connection or not. To write a method that supports the transactions, you simple pass the last argument into the query method as last argument.
```javascript
/**
 * method to increase the likecount of a user
 * @param {String} id the user to target
 * @param {Number} amount about to change the count
 * @param {Object} conneciton to supports transactions
 */
userDao.increaseById = function(id, amount, conneciton){
	return this.db.query("UPDATE ?? SET likes = likes + ? WHERE ?? = ?",[this.tableName, amount, "id", id], connection);
};
```
You see, simple pass the connection into an other transaction supporting method;

## paging
The base of the pageing is db.selectPaged(). witch is the query method with two additional optional parameter. page and pageSize before the optional connection. It will execute the query using db.query with a sqlString extended by a limit clouse. It will also execute the query with counting the results, an object with the result and the counts.

```javascript
userDao.getAll(0,10).then(function( res, ){
  console.log(res.result)// [the 10 first userobjects]
  console.log(res.counts.resultCount) // 199
  console.log(res.counts.pageCount) // 20
});
```

## function reference
For now check out the source under [Github/tobiasnickel/tmysqlcontroller.js](https://github.com/TobiasNickel/tmysqlcontroller/blob/master/tMysqlController.js). The code is not to long and documented

Tobias Nickel  

![alt text](https://avatars1.githubusercontent.com/u/4189801?s=150)
