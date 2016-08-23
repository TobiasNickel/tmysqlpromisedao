module.exports.isArray = function isArray(obj) {
    return Array.isArray(obj);
};

module.exports.isEmptyArray = function isEmptyArray(obj) {
    return isArray(obj) && obj.length == 0;
};

module.exports.containsEmptyArray = function containsEmptyArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (isEmptyArray(arr[i])) return true;
    }
    return false;
};

module.exports.containsArray = function containsArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (isArray(arr[i])) return true;
    }
    return false;
};

module.exports.last = function last(arr) {
    return arr[arr.length - 1];
};

module.exports.slice = function slice(args) {
    return Array.prototype.slice.apply(args);
};