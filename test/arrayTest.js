var array = require('../lib/utils/array')
var assert = require('assert');
module.exports = function(){

    assert.ok(array.isArray([])===true, 'is Array');
    assert.ok(array.isArray({})===false, 'is not an Array');    

    assert.ok(array.isEmptyArray([])===true, 'is empty Array');
    assert.ok(array.isEmptyArray([1])===false, 'is not empty Array');

    assert.ok(array.containsEmptyArray([1,[]])===true, 'contains empty Array');
    assert.ok(array.containsEmptyArray([1,2])===false, 'contains empty Array');

    assert.ok(array.containsArray([1,[2]])===true, 'contains Array');
    assert.ok(array.containsArray([1,2])===false, 'contains Array');

    assert.ok(array.last([1,4])===4, 'last 4');
    assert.ok(array.last([1])===1, 'last 1');
    assert.ok(array.last([])===undefined, 'last 4');
    assert.ok(array.last([1,'Tobias'])==='Tobias', 'last 1');

    var arr = [1,2,3];
    assert.deepEqual(arr,array.slice(arr),'slice array looks same');
    assert.ok(arr!=array.slice(arr),'is new array');


    assert.ok(array.isStringArray(['1'])===true, ' is string Array');
    assert.ok(array.isStringArray([1])===false, ' is not string Array');

    assert.ok(array.isNumberArray([1])===true, ' is number Array');
    assert.ok(array.isNumberArray(['1'])===false, ' is not number Array');

    assert.ok(array.isObjectArray([{}])===true, ' is object Array');
    assert.ok(array.isObjectArray(['1'])===false, ' is not object Array');

}