function requireSignature(req, res, next) {
    if (!req.session.user.idSig) {
        res.redirect("/petition");
    } else {
        next();
    }
}

function requireNoSignature(req, res, next) {
    if (req.session.user.idSig) {
        res.redirect("/thanks");
    } else {
        next();
    }
}

function requireLoggedOutUser(req, res, next) {
    if (req.session.user) {
        res.redirect("/petition");
    } else {
        next();
    }
}

exports.requireSignature = requireSignature;
exports.requireNoSignature = requireNoSignature;
exports.requireLoggedOutUser = requireLoggedOutUser;
