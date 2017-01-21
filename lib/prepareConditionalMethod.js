
var array = require('./utils/array');
var isConnection = require('./isConnection');
var countMysqlParameter = require('./countMysqlParameter');

/**
 * extent the crontroller with methods to fetch related data.
 */
module.exports = function prepareConditionalMethod(db, dao, tableName, name, definition) {
    var addName = name[0].toUpperCase() + name.slice(1).toLowerCase();
    var fetchName = definition.fatchName || (name);

    var condition = definition.condition ? ' (' + definition.condition + ')' : '1';
    var sql = 'SELECT * FROM ' + tableName + ' WHERE ' + condition;
    var parameterCount = countMysqlParameter(sql);

    dao['get' + addName] = function (connection) {
        arguments = array.slice(arguments);
        var connection = null;
        var lastArg = array.last(arguments);

        if (isConnection(lastArg)) {
            connection = arguments.pop();
        }

        if (arguments.length < parameterCount) {
            throw new Error('to few parameter to the query:' + sql);
        }

        var query;
        if (arguments.length === parameterCount) {
            query = db.query(sql, arguments, connection);
        } else if (arguments.length - parameterCount === 1) {
            query = db.selectPaged(sql, arguments, arguments.pop(), connection)
        } else if (arguments.length - parameterCount === 2) {
            query = db.selectPaged(sql, arguments, arguments.pop(), arguments.pop(), connection)
        } else {
            throw new Error('to many parameter for the query:' + sql);
        }

        return dao.promiseMap(query.then(function (list) {
            if (definition.multiple) return list;
            return list[0];
        }));
    }
}

