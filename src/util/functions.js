exports.exclude = (query, ...keys) => {
    for (let key of keys) {
        delete query[key]
    }
    return query
}