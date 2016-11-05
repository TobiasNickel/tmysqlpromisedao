var countMysqlParameter = require('../lib/countMysqlParameter');
var assert = require('assert')

module.exports = function test(){
    assert.ok(countMysqlParameter('select * from users')==0,'no param in simple select')
    try{
        countMysqlParameter();
        assert.ok(false, 'require string parameter')
    }catch(err){
        assert.ok(true,'have catched error')
    }
    assert.ok(countMysqlParameter('select ?? from users')==1,'fieldName to be one param')
    assert.ok(countMysqlParameter('select * from users where name = ?')==1,'a simple value param')
    assert.ok(countMysqlParameter('select ?? from users where name = ?')==2,'mutiple params')

}