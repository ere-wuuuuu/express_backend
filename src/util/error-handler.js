module.exports = (err, req, res, next) => {
    if (!err.message) {
        return res.status(err.status || 500).send(err);
    }
    let error;
    try {
        error = JSON.parse(err.message);
    } catch (e) {
        error = { status: 500, error: [{ msg: err.message }] };
    }
    res.status(error.status || 500).send(error);
};
