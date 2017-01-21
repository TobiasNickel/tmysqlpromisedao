
var array = require('./utils/array');
var isConnection = require('./isConnection')

/**
 * extent the crontroller with methods to fetch related data.
 */
module.exports = function prepareFetchMethod(db, dao, tableName, name, definition) {
    var addName = name[0].toUpperCase() + name.slice(1).toLowerCase();
    var fetchName = definition.fatchName || (name);

    var condition = definition.condition ? 'AND (' + definition.condition + ')' : '';

    dao['fetch' + addName] = function (objs, connection) {
        if (!Array.isArray(objs)) { objs = [objs]; }
        if (!objs.length) {
            return db.newPromise(function (resolve, reject) {
                resolve([]);
            });
        }
        var params = [];
        arguments = array.slice(arguments);
        arguments.shift();//remove objs from arguments;
        var arg = arguments.shift();
        while (arg != undefined && !isConnection(arg)) {
            params.push(arg);
            arg = arguments.shift();
        }
        connection = arg;
        var objsByKey = {};
        var keys = objs.map(function (obj) {
            var key;
            if (typeof obj == 'string') {
                key = obj;
                obj = {};
                obj[name] = key;
            } else {
                key = obj[definition.mapTo.localField || name];
            }
            if (!objsByKey[key]) objsByKey[key] = [];
            objsByKey[key].push(obj);
            return key;
        });
        var foreignKey = (definition.mapTo.foreignKey || db.defaultPrimaryName);
        
        return this.db.query('SELECT * FROM ' + definition.mapTo.tableName + ' WHERE ' + foreignKey + ' IN (?)' + condition, [keys], connection)
            .then(function (list) {
                list.forEach(function (item) {
                    var key = item[definition.mapTo.foreignKey]
                    var objs = objsByKey[key];
                    objs.forEach(function (obj) {
                        if (definition.mapTo.multiple) {
                            if (!obj[fetchName]) obj[fetchName] = [];
                            obj[fetchName].push(item);
                        } else {
                            obj[fetchName] = item;
                        }
                    });
                });
                return list;
            });
    }
}
