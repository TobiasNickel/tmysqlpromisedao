var tmysqldao = require('./tMysqlDao');

var db = tmysqldao({
    connectionLimit: 5,
    host: process.env.HOST || 'localhost',
    user: process.env.USER || 'root',
    password: process.env.PASSWORD || '',
    database: process.env.DB || 'screen'
    //,debug:true
});

var userDao = db.prepareDao({
    tableName: 'users',
    fields: {
        id: { type:'INT AUTO_INCREMENT',primary: true },
        name: {type:'varchar(30)'},
        mail: {type:'varchar(255)'},
        password: {type:'char(34)'},
        registered: {type:'INT'}
    },
    has: {
        images: { tableName: 'images', foreignKey: 'owner', localField: 'id', multiple: true },
    },
    conditionals: {
        new: { condition:'TO_DAYS(registered) > (TO_DAYS(NOW())-10)', multiple: true } // to provide a getNew method that return the users registered in the last 10 days
    }
});
var imageDao = db.prepareDao({
    tableName: 'images',
    fields: {
        id: { type:'INT AUTO_INCREMENT',primary: true },
        name: {type:'varchar(30)'},
        path: {type:'varchar(255)'},
        owner: {type:'int', mapTo:{tableName:'users',foreignKey:'id'}},
        uploadTime: {type:'datetime'}
    },
    has: {
        likes: { tableName: 'likes', foreignKey: 'image', localField: 'id', multiple: false },
    },
    conditionals:{
        newest:{ condition:'not exists (SELECT * from images as i where i.uploadTime>uploadTime )', multiple: false },
        new:{ condition:'TO_DAYS(uploadTime) > (TO_DAYS(NOW())-10)', multiple: true } // to provide a getNew method that return the users registered in the last 10 days
    }
});
var likeDao = db.prepareDao({
    tableName: 'likes',
    fields: {
        user: { type:'INT', primary:true, mapTo:{tableName:'users',foreignKey:'id'} },
        image: {type:'INT', primary:true, mapTo:{tableName:'images',foreignKey:'id'}},
        time: {type: 'datetime'}
    },
    conditionals:{
        new:{ condition:'TO_DAYS(uploadTime) > (TO_DAYS(NOW())-10)'} // to provide a getNew method that return the users registered in the last 10 days
    }
});

db.logQueries = false;
async function test(){
    console.log('prepare dao: DONE');
    var users = null;
    var objs = null;
    try{

        await userDao.createTable();
        console.log("create teable users done;")
        await imageDao.createTable();
        await likeDao.createTable();
        console.log('createTable: DONE');

        await userDao.insert({name:'tobias',mail:'business@tnickel.de',password:"kvckxchlksjfhliu",registered:1});
        await likeDao.insert({user:0,image:0,time:new Date()});
        users = await userDao.getAll();
        var user1 = users[0];
        await imageDao.insert({name:'superman.jpg', path:'images/1/superman.jpg', owner:user1.id, uploadTime:new Date()});
        console.log('insert object: DONE');
            
        users[0].name='Tobias';
        await userDao.save(users[0]);
        await likeDao.fetchImage(users[0]);
        await userDao.saveOne(users[0]);
        await db.saveOne('users',{id:0,name:'Tobias N'});
        await userDao.getOneById(0);
        await userDao.findWhere({id:0});
        await userDao.getById(0);
        await userDao.fetchImages(users);
        await userDao.fetchImages('0','some param','second useless param');
        await userDao.fetchImages([]);
        await imageDao.getNewest('blabla','soso');
        var newImages = await imageDao.getNew('blabla','soso');
        console.log('load conditional Images: DONE',newImages.length == 1);
        //console.log(JSON.stringify(users,null,'  '))
        await imageDao.remove(newImages);
        await imageDao.removeById(4);
        var connection = await db.beginTransaction();
        await connection.rollback();
        connection = await db.beginTransaction();
        await connection.commit();
        await likeDao.remove({user:0,image:0});
        try{
            await db.save('usas','id',{name:'unchanges'});
        }catch(err){
            console.log('catched Error: DONE');
        }
        try{
            await db.selectPaged('SELECT * FROM usas',0,1);
        }catch(err){
            console.log('catched Error: DONE');
        }
        await imageDao.findOneWhere({name:'superman.jpg'});
        await imageDao.dropTable();
        await likeDao.dropTable();
        //await userDao.dropTable();
    }catch(err){
        console.log('failed:', err,err.stack);
    }
}
test();

