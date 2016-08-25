var isConnection = require('../lib/isConnection')
var assert = require('assert');
module.exports = function(){

    assert.ok(isConnection(null)===false, 'a number is not a connection');
    assert.ok(isConnection(1)===false, 'a number is not a connection');
    assert.ok(isConnection('')===false, 'a string is not a connection');
    assert.ok(isConnection([])===false, 'an array is not a connection');
    assert.ok(isConnection({})===false, 'an empty object is not a connection');
    assert.ok(isConnection({query:function(){}})===true, 'object with queryFunction is a connection');

}