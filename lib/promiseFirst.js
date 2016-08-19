module.exports = function first(promise) {
    promise.then(function (data) {
        return data[0];
    });
}