module.exports.requireSignature = (req, res, next) => {
    if (!req.session.user.idSig) {
        res.redirect("/petition");
    } else {
        next();
    }
};

module.exports.requireNoSignature = (req, res, next) => {
    if (req.session.user.idSig) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

module.exports.requireLoggedOutUser = (req, res, next) {
    if (req.session.user) {
        res.redirect("/petition");
    } else {
        next();
    }
}
