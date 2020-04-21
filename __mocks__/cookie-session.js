let tempSession,
    session = {};

module.exports = () => (req, res, next) => {
    req.session = tempSession || session; // is fake cookie, "tempSession" exists in only one test, "session" can be reused across multiple tests
    tempSession = null;
    next();
};

module.exports.mockSession = (sess) => (session = sess);

module.exports.mockSessionOnce = (sess) => (tempSession = sess);
