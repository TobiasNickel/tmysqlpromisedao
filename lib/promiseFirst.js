module.exports = function first(promise) {
    return promise.then(function (data) {
        return data[0];
    });
}