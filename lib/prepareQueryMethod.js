var countMysqlParameter = require('./countMysqlParameter');
var array = require('./utils/array');
var isConnection = require('./isConnection')

/**
 * extent the crontroller with methods to fetch related data.
 */
module.exports = function prepareQueryMethod(db, dao, tableName, name, sql) {
    var parameterCount = countMysqlParameter(sql);
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
            return db.query(sql, params, connection);
        }
        if (arg.length > 2) throw new Error('to many params for the query ' + name + ':' + sql)
        if (typeof arg[0] !== 'undefined' && isNaN(parseInt(arg[0]))) throw new Error('pagingParameter(page) need to be a number not:' + arg[0] + ' for ' + name + ':' + sql);
        if (typeof arg[1] !== 'undefined' && isNaN(parseInt(arg[1]))) throw new Error('pagingParameter(pagesize) need to be a number for ' + name + ':' + sql);
        if (arg.length === 1) {
            return db.selectPaged(sql, params, arg[0], connection);
        } else {
            return db.selectPaged(sql, params, arg[0], arg[1], connection);
        }
    }
}