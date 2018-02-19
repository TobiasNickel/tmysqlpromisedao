var prepareFetchMethod = require('../lib/prepareFetchMethod')
var assert = require('assert');

//function prepareFetchMethod(db, dao, tableName, name, definition)
module.exports = function(done) {
    return new Promise(function(resolve) {
        var db = createDBMock();
        var dao = { db: db };
        var tableName = 'user';
        var name = 'avatar';
        var definition = { mapTo: { tableName: 'image', foreignKey: 'id', localField: 'avatarId', mutliple: false } };
        prepareFetchMethod(db, dao, tableName, name, definition);

        var testUser = {
            id: 1,
            name: 'tobias',
            avatarId: 1
        }
        dao.fetchAvatar(testUser).then(function() {
            resolve();
        }).catch(function() {
            resolve();
        });
    })
}

function createDBMock() {
    return {
        daos: {},
        query: function(sql, params, connection) {
            return new Promise(function(resolve) {
                resolve([{ id: 1, field: 'someting' }]);
            });
        },
        queryPaged: function(sql, params, connection) {
            return new Promise(function(resolve) {
                resolve([{ id: 1, field: 'someting' }]);
            });
        },
        defaultPrimaryName: 'id'
    }
}