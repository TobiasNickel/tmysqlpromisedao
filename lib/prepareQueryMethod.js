var countMysqlParameter = require('./countMysqlParameter');
var array = require('./utils/array');
var isConnection = require('./isConnection')

/**
 * extent the crontroller with methods to fetch related data.
 */
module.exports = function prepareQueryMethod(db, dao, tableName, name, sql) {
    var parameterCount = countMysqlParameter(sql);
    var isDaoSelectQuery = isDaoSelect(sql,dao);
    dao[name] = function () {
        var params = [];
        var arg = array.slice(arguments);
        var params = arg.splice(0, parameterCount);
        if (params.length != parameterCount) throw new Error('not enough parameter for ' + name + '');
        if (isConnection(array.last(params))) throw new Error('not enough parameter for ' + name + '');

        var connection;
        if (arg.length) {
            if (isConnection(array.last(arg))) {
                connection = arg.pop();
            }
        }
        if (!arg.length) {
            if(isDaoSelectQuery){
                return db.query(sql, params, connection);
            }else{
                return dao.promiseMap(db.query(sql, params, connection));
            }
        }
        if (arg.length > 3) throw new Error('to many params for the query ' + name + ':' + sql)
        //if (typeof arg[0] !== 'undefined' && isNaN(parseInt(arg[0]))) throw new Error('pagingParameter(page) need to be a number not:' + arg[0] + ' for ' + name + ':' + sql);
        //if (typeof arg[1] !== 'undefined' && isNaN(parseInt(arg[1]))) throw new Error('pagingParameter(pagesize) need to be a number for ' + name + ':' + sql);
        if (arg.length === 1) {
            if(isDaoSelectQuery){
                return db.selectPaged(sql, params, arg[0], arg[1], connection);
            }else{
                return dao.promiseMap(db.selectPaged(sql, params, arg[0], arg[1], connection));
            }
        } else {
            if(isDaoSelectQuery){
                return db.selectPaged(sql, params, arg[0], arg[1], arg[2], connection);
            }else{
                return dao.promiseMap(db.selectPaged(sql, params, arg[0], arg[1], arg[2], connection));
            }
        }
    }
}

function isDaoSelect(sql,dao){
    if(sql.indexOf(dao.tableName)===-1)return false;
    sql = sql.trim().toLowerCase();
    if(sql.indexOf('select * from')!=0)return false;
    return true;
}