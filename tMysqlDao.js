var mysql = require('mysql');
var newPromise = require('./lib/newPromise');
var prepareFetchMethod = require('./lib/prepareFetchMethod');
var prepareQueryMethod = require('./lib/prepareQueryMethod');
var slice = require('./lib/slice');
var isConnection = require('./lib/isConnection');
var prepareConditionalMethod = require('./lib/prepareConditionalMethod');
var first = require('./lib/promiseFirst');

module.exports = function (config) {
    var db = {
        logQueries: true,
        pool: mysql.createPool(config),
        /**
         * query method, that can get a connection, to support transactions
         * you can follow a paradime where you have connection  is the last params, and call query with both.
         * so your method can also run in a transaction. otherwise the query method is compatible to the mysql-connection/pool.query method
         * @param {string} sql the querystring
         * @param {array} [params] the parameter that get insert into the query
         * @param {mysql-connection} connection to be used for this query.
         */
        query(sql, params, connection) {
            return (db.newPromise(function (resolve, reject) {
                if (isConnection(params)) {
                    connection = params;
                    params = [];
                }
                if (!isConnection(connection)) connection = db.pool;
                if (db.logQueries) {
                    console.log(mysql.format(sql, params));
                }
                connection.query(sql, params, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            }));
        },

        /**
         * promise factory, that can be replaced, to use different promise-libraries.
         */
        newPromise: newPromise,

        /**
         * get a connectio where the transaction is started.
         */
        beginTransaction() {
            return db.newPromise(function (resolve, reject) {
                db.pool.getConnection(function (err, connection) {
                    if (err) { reject(err); return }
                    connection.beginTransaction(function (err) {
                        if (err) { reject(err); return; }
                        resolve(extendTransactionConnection(connection));
                    });
                });
            })
        },

        defaultPagesize: 20,

        /**
         * like query, but provide pageing for select queries.
         * @param {string} sql, the query without semicolon on the end
         * @param {Array} values parameterlist for the Query
         * @param {Number} [page] the page to get, if not provided: get all
         * @param {Number} [pagesize] the number of objects to receife in a single request. default is 20
         * @param {mysql-connection} connection to be used for this query.
         */
        selectPaged: function (sql, values, page, pagesize, connection) {
            var paging = '';
            if (isConnection(page)) {
                connection = page;
                page = null;
                pagesize = null;
            } else if (typeof pagesize === 'object') {
                connection = pagesize;
                pagesize = db.defaultPagesize;
            }
            if (isNaN(parseInt(page))) {
                return db.query(sql, values, connection);
            } else {
                return db.newPromise(function (resolve, reject) {
                    paging = ' LIMIT ' + (page * pagesize) + ',' + pagesize;
                    var pages = null;
                    var result = null;
                    db.query(sql + paging, values, connection)
                        .then(function (res) {
                            result = res;
                            done();
                        }).catch(function (err) {
                            result = err;
                            done();
                        });
                    db.query('SELECT count(*) as resultCount ' + sql.slice(sql.toLowerCase().indexOf('from')), values, connection)
                        .then(function (c) {
                            var response = c[0] ? c[0] : { resultCount: 0 };
                            pages = {
                                resultCount: response.resultCount,
                                pageCount: Math.ceil(response.resultCount / pagesize)
                            }
                            done();
                        }).catch(function (err) {
                            pages = err;
                            done();
                        });
                    function done() {
                        if (pages !== null && result !== null) {
                            if (pages instanceof Error) {
                                reject(pages);
                            } else if (result instanceof Error) {
                                reject(result);
                            } else {
                                result.pageCount = pages.pageCount;
                                result.resultCount;
                                resolve(result);
                            }
                        }
                    }

                });
            }
        },

        /**
         * query data with a specific property.
         * @param {string} tableName, the table
         * @param {string} fieldName the name of the collom
         * @param {mixed} value one or an Array of simple values where the result should have (String, Number, Boolean, null)
         * @param {Number} [pagesize] the number of objects to receife in a single request. default is 20
         * @param {mysql-connection} connection to be used for this query.
         */
        getBy: function (tableName, fieldName, value, page, pagesize, connection) {
            var sql = 'SELECT * FROM ' + tableName + ' WHERE ' + fieldName + ' IN (?)';
            return db.selectPaged(sql, [value], page, pagesize, connection);
        },

        /**
         * query data with a specific property.
         * @param {string} tableName, the table 
         * @param {string} fieldName the name of the collom
         * @param {mixed} value one or an Array of simple values where the result should have (String, Number, Boolean, null)
         * @param {Number} [pagesize] the number of objects to receife in a single request. default is 20
         * @param {mysql-connection} connection to be used for this query.
         */
        getOneBy: function (tableName, fieldName, value, connection) {
            var sql = 'SELECT * FROM ' + tableName + ' WHERE ' + fieldName + ' IN (?) LIMIT 0, 1;';
            return first(db.query(sql, [value], connection));
        },

        /**
         * query rows that have multiple specific values
         * @param {string} tableName, the table 
         * @param {object} object with key-values that should metch the resultRows
         * @param {Number} [pagesize] the number of objects to receife in a single request. default is 20
         * @param {mysql-connection} connection to be used for this query.
         */
        findWhere: function (tableName, obj, page, pagesize, connection) {
            var sql = 'SELECT * FROM ' + tableName + ' WHERE ';
            var where = '1 '
            var values = [];
            for (var i in obj) {
                where += ' AND ?? = ?';
                values.push(i);
                values.push(obj[i]);
            }
            return db.selectPaged(sql + where, values, page, pagesize, connection);
        },

        /**
         * query rows that have multiple specific values
         * @param {string} tableName, the table 
         * @param {object} object with key-values that should metch the resultRows
         * @param {Number} [pagesize] the number of objects to receife in a single request. default is 20
         * @param {mysql-connection} connection to be used for this query.
         */
        findOneWhere: function (tableName, obj, connection) {
            var sql = 'SELECT * FROM ' + tableName + ' WHERE ';
            var where = '1 '
            var values = [];
            for (var i in obj) {
                where += ' AND ?? = ?';
                values.push(i);
                values.push(obj[i]);
            }
            var limit = ' LIMIT 0,1;'
            return first(db.query(sql + where + limit, values, connection));
        },

        /**
         * remove objects according to there primary key.
         * @param {string} tableName, the table
         * @param {String | Array of String} idKey one or more names that make there primary key
         * @param {Object | Array} [objs] objects to delete from database. for single key tables a string or number is fine as key.
         * @param {mysql-connection} connection to be used for this query.
         */
        remove: function (tableName, idKey, objs, connection) {
            if (!Array.isArray(objs)) { objs = [objs]; }
            if (!Array.isArray(idKey)) { idKey = [idKey]; }
            var sql = 'DELETE FROM ' + tableName + ' WHERE ';
            if (idKey.length === 1) {
                var key = idKey[0];
                var ids = objs.map(function (obj) {
                    if (typeof obj == 'object') {
                        return obj[key];
                    } else {
                        return obj;
                    }
                });
                sql += key + ' IN (?);';
                return db.query(sql, [ids], connection);
            } else {
                var values = [];
                var whereStringBuilder = [];
                for (var i in objs) {
                    var obj = objs[i];
                    var clouseBuilder = []
                    idKey.forEach(function (key) {
                        clouseBuilder.push('?? = ?');
                        values.push(key);
                        values.push(obj[key]);
                    });
                    whereStringBuilder.push('(' + clouseBuilder.join(' AND ') + ')')
                }
                sql += whereStringBuilder.join('OR');
                console.log('remove', sql)
                return db.query(sql, values, connection);
            }
        },

        /**
         * Insert some oject to the given table it will only use the properties,
         * that are direct on the object(no prototype chain) and ignore neasted objects
         * @param {string} tableName, the table to insert
         * @param {object} obj data to insert
         * @param {mysql-connection} connection to be used for this query.
         */
        insert: function (tableName, obj, connection) {
            var val = {};
            for (var i in obj) {
                if (obj.hasOwnProperty(i) && (typeof obj[i] !== 'object' || obj[i] instanceof Date)) {
                    val[i] = obj[i];
                }
            }

            var sql = 'INSERT INTO ' + tableName + ' SET ?';
            return db.query(sql, val, connection)
                .then(function (result) {
                    obj.id = result.insertId;
                    return result.insertId;
                });
        },

        /**
         * updates the values of rows, based on the primary key
         * @param {string} tableName, the table to insert
         * @param {String | Array of String} primaries one or more names that make there primary key
         * @param {Object | Array} objs one or more objects to update. (key can not change.)
         * @param {mysql-connection} connection to be used for this query.
         */
        save: function (tableName, primaries, objs, connection) {
            return db.newPromise(function (resolve, reject) {
                if (!Array.isArray(objs)) { objs = [objs]; }
                var number = objs.length;
                var count = 0;
                var errors = [];
                objs.forEach(function (obj) {
                    db.saveOne(tableName, primaries, obj, connection)
                        .then(function () {
                            count++;
                            if (count === number) {
                                if (errors.length) {
                                    reject(errors);
                                } else {
                                    resolve();
                                }
                            }
                        }).catch(function (err) {
                            count++;
                            errors.push([obj, err]);
                            if (count === number) {
                                reject(errors);
                            }
                        })
                });
            });
        },

        /**
         * updates the values of a row, based on there primary key
         * @param {string} tableName, the table to insert
         * @param {String | Array of String} primaries one or more names that make there primary key
         * @param {Object} keys only ONE object to update. (key can not change.)
         * @param {mysql-connection} connection to be used for this query.
         */
        saveOne: function (tableName, primaries, keys, connection) {
            // primaries is optional parameter, default is 'id'
            if (!Array.isArray(primaries) && typeof primaries !== 'string') {
                connection = keys;
                keys = primaries;
                primaries = ['id'];
            }
            // primaries can be one or more Keys
            if (!Array.isArray(primaries)) primaries = [primaries];

            var sql = 'UPDATE ' + tableName + ' SET ';
            var keybuilder = [];
            var params = [];
            for (var i in keys) {
                if (primaries.indexOf(i) === -1 && typeof keys[i] !== 'object') {
                    keybuilder.push(i + '=?');
                    params.push(keys[i]);
                }
            }
            sql += keybuilder.join(',');
            sql += ' WHERE ';
            primaries.forEach(function (primary, index) {
                if (index) sql += ' AND ';
                sql += '?? = ?';
                params.push(primary);
                params.push(keys[primary]);
            });
            console.log(sql)
            return db.query(sql + ';', params, connection);
        },

        /**
         * to extend a controller-template with all possible usefull methods
         * @param {object} comtroller having properties that discribe the table accessed by the controller.
         */
        prepareDao: function (dao) {
            var tableName = dao.tableName;
            var IDKeys = [];

            dao.db = db;

            dao.insert = function (obj, connection) {
                return db.insert(tableName, obj, connection);
            };
            dao.save = function (objs, connection) {
                return db.save(tableName, IDKeys, objs, connection);
            };
            dao.saveOne = function (obj, connection) {
                return db.saveOne(tableName, IDKeys, obj, connection);
            };

            dao.getAll = function (page, pageSize, connection) {
                return db.selectPaged('SELECT * FROM ??', [tableName], page, pageSize, connection);
            };

            dao.findWhere = function (obj, page, pageSize, connection) {
                return db.findWhere(tableName, obj, page, pageSize, connection);
            };
            dao.findOneWhere = function (obj, connection) {
                return db.findOneWhere(tableName, obj, connection);
            };

            dao.remove = function (obj, connection) {
                return db.remove(tableName, IDKeys, obj, connection);
            };

            dao.createTable = function (connection) {
                var sql = 'CREATE TABLE IF NOT EXISTS ?? (';
                var params = [tableName];
                var fieldSQLs = [];
                var primaries = [];
                for (var i in dao.fields) {
                    var field = dao.fields[i];
                    var fieldSql = '?? ';
                    params.push(i);
                    fieldSql += (field.type || 'varchar(255)');
                    if (field.primary) { primaries.push(i); }
                    fieldSQLs.push(fieldSql);
                }
                sql += fieldSQLs.join(',')
                if (primaries.length) {
                    sql += ',PRIMARY KEY(' + primaries.join(',') + ')';
                }
                sql += ')';
                return db.query(sql, params, connection);
            };

            dao.dropTable = function (conneciton) {
                return db.query('DROP TABLE IF EXISTS ??', [tableName], conneciton);
            };

            var fieldNames = Object.keys(dao.fields);
            fieldNames.forEach(function(name){
                var definition = dao.fields[name];
                var addName = name[0].toUpperCase() + name.slice(1).toLowerCase();

                dao['getBy' + addName] = function (value, page, pageSize, connection) {
                    return db.getBy(tableName, name, value, page, pageSize, connection);
                };

                dao['getOneBy' + addName] = function (value, connection) {
                    return db.getOneBy(tableName, name, value, connection);
                };

                dao['removeBy' + addName] = function (value, connection) {
                    return db.remove(tableName, name, value, connection);
                };

                prepareFetchMethod(db, dao, tableName, name, definition);

                if (definition.primary) { IDKeys.push(name); }
            });
            if (!IDKeys.length) IDKeys.push('id');
            if (dao.has) {
                for (var name in dao.has) {
                    prepareFetchMethod(db, dao, tableName, name, { mapTo: dao.has[name] });
                }
            }
            if (dao.conditionals) {
                for (var name in dao.conditionals) {
                    prepareConditionalMethod(db, dao, tableName, name, dao.conditionals[name]);
                }
            }
            if (dao.queries) {
                for (var name in dao.queries) {
                    prepareQueryMethod(db, dao, tableName, name, dao.queries[name]);
                }
            }
            return dao;
        }
    };
    /**
     * makes sure, that poolconnections get released when they got committed or rollback
     */
    var extendTransactionConnection = function (connection) {
        if (connection.rollback && !connection._OrgRollback && connection.commit && !connection._OrgCommit && connection.release) {
            connection._OrgRollback = connection.rollback;
            connection.rollback = function (callback) {
                return db.newPromise(function (resolve, reject) {
                    connection._OrgRollback(function (err) {
                        if (err) { reject(err); return; }
                        connection.release();
                        resolve(null);
                    });
                });
            };

            connection._OrgCommit = connection.commit;
            connection.commit = function (callback) {
                return db.newPromise(function (resolve, reject) {
                    connection._OrgCommit(function (err) {
                        if (err) { reject(err); return; }
                        connection.release();
                        resolve(null);
                    });
                });
            };
        }
        return connection;
    };
    return db;
}

