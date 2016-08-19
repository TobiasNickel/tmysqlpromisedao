
var slice = require('./slice');
var isConnection = require('./isConnection');

/**
 * extent the crontroller with methods to fetch related data.
 */
module.exports = function prepareConditionalMethod(db, dao, tableName, name, definition) {
    var addName = name[0].toUpperCase() + name.slice(1).toLowerCase();
    var fetchName = definition.fatchName || (name);

    var condition = definition.condition ? ' (' + definition.condition + ')' : '1';

    dao['get' + addName] = function (connection) {
        var params = [];
        arguments = slice(arguments);
        var arg = arguments.shift();
        while (arg != undefined && !isConnection(arg)) {
            params.push(arg);
            arg = arguments.shift();
        }
        connection = arg;
        var objsByKey = {};
        var sql = 'SELECT * FROM ' + tableName + ' WHERE ' + condition;
        return db.query(sql, params, connection)
            .then(function (list) {
                if (definition.multiple) return list;
                return list[0];
            });
    }
}

