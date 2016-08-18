
module.exports = function countMysqlParams(sql) {
    if (typeof sql !== 'string') throw new Error("sql must ba a string, not " + typeof sql);
    var pos = 0;
    var index = sql.indexOf('?', pos);
    var count = 0;
    while (index != -1) {
        pos = index + 2;
        count++;
        var index = sql.indexOf('?', pos);
    }
    return count;
};
