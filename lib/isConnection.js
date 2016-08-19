/**
 *test if some object can be used to query
 */
module.exports = function isConneciton(obj) {
    if (typeof obj !== 'object') return false;
    if (typeof obj.query !== 'function') return false;
    return true;
};