module.exports={
    isArray: isArray,
    isEmptyArray: isEmptyArray,
    containsEmptyArray: containsEmptyArray,
    containsArray: containsArray,
    last: last,
    slice: slice,
    isStringArray: isStringArray,
    isNumberArray: isNumberArray,
    isObjectArray: isObjectArray
};

function isArray(obj) {
    return Array.isArray(obj);
};

function isEmptyArray(obj) {
    return isArray(obj) && obj.length == 0;
};

function containsEmptyArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (isEmptyArray(arr[i])) return true;
    }
    return false;
};

function containsArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (isArray(arr[i])) return true;
    }
    return false;
};

function last(arr) {
    return arr[arr.length - 1];
};

function slice(args) {
    return Array.prototype.slice.apply(args);
};

function isStringArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== 'string') return false;
    }
    return true;
};

function isNumberArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== 'number') return false;
    }
    return true;
};

function isObjectArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== 'object') return false;
    }
    return true;
};