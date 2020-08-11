const express = require("express");
const app = express();
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const db = require("./db.js");
const csurf = require("csurf");
const { hash, compare } = require("./bc");
const helmet = require("helmet");
// const {
//     requireSignature,
//     requireNoSignature,
//     requireLoggedOutUser,
// } = require("/.middleware");
// const profileRouter = require("./routes/profile");

//////////////////// HANDLEBARS BOILERPLATE ////////////////////
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//////////////////// MIDDLEWARE ////////////////////
app.use(helmet());

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(
    cookieSession({
        secret: `Mein Kite ist wichtiger als D.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(csurf());

app.use((req, res, next) => {
    res.set("X-Frame-Options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(express.static("./public"));

app.use(function (err, req, res, next) {
    console.error("error in middleware:", err.stack);
    res.status(500).send("Something broke, status code 500!");
});

//////////////////// ROUTES ////////////////////

app.get("/", (req, res) => {
    res.redirect("/register");
});

//////////////////// REGISTER SITE ////////////////////
app.get("/register", (req, res) => {
    if (req.session.user) {
        res.redirect("/petition");
    } else {
        res.render("register");
    }
});

app.post("/register", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;
    let password = req.body.password;
    req.session.user = {};

    if (first != "" && last != "" && email != "" && password != "") {
        hash(password)
            .then((hashedPw) => {
                return db.addUser(first, last, email, hashedPw);
            })
            .then((response) => {
                req.session.user = {
                    id: response.rows[0].id,
                };
                res.redirect("/profile");
            })
            .catch((err) => {
                console.log("POST /register, catch:", err);
                res.render("register", { error: true });
            });
    } else {
        res.render("register", {
            error: true,
        });
    }
});

//////////////////// PROFILE SITE ////////////////////
app.get("/profile", (req, res) => {
    if (!req.session.user) {
        res.redirect("/register");
    } else {
        res.render("profile");
    }
});

app.post("/profile", (req, res) => {
    let age = req.body.age;
    let city = req.body.city;
    let url = req.body.url;
    let user_id = req.session.user.id;

    if (
        url != "" &&
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {
        res.render("profile", {
            error: true,
        });
    } else {
        db.addProfile(age || null, city, url, user_id)
            .then((response) => {
                req.session.user.idProf = response.rows[0].id;
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log(
                    "POST /profile, redirect to /petition, catch:",
                    err
                );
                res.redirect("/petition");
            });
    }
});

//////////////////// EDIT SITE ////////////////////
app.get("/profile/edit", (req, res) => {
    if (!req.session.user) {
        res.redirect("/register");
    } else {
        let id = req.session.user.id;
        db.getInfoForUpdate(id)
            .then((result) => {
                res.render("edit", {
                    first: result.first,
                    last: result.last,
                    email: result.email,
                    age: result.age,
                    city: result.city,
                    url: result.url,
                });
            })
            .catch((err) => {
                console.log("GET /edit, catch:", err);
            });
    }
});

app.post("/profile/edit", (req, res) => {
    let id = req.session.user.id;
    let { first, last, email, password, age, city, url } = req.body;

    if (first == "" || last == "" || email == "") {
        let id = req.session.user.id;
        db.getInfoForUpdate(id).then((result) => {
            res.render("edit", {
                error: true,
                first: result.first,
                last: result.last,
                email: result.email,
                age: result.age,
                city: result.city,
                url: result.url,
            });
        });
    }

    if (
        url != "" &&
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {
        let id = req.session.user.id;
        db.getInfoForUpdate(id).then((result) => {
            res.render("edit", {
                errorUrl: true,
                first: result.first,
                last: result.last,
                email: result.email,
                age: result.age,
                city: result.city,
                url: result.url,
            });
        });
    } else if (password == "") {
        db.updateFirstLastEmail(first, last, email, id)
            .then(() => {
                return db.upsertProfile(age || null, city, url, id);
            })
            .then(() => {
                let id = req.session.user.id;

                db.getInfoForUpdate(id).then((result) => {
                    res.render("edit", {
                        first: result.first,
                        last: result.last,
                        email: result.email,
                        age: result.age,
                        city: result.city,
                        url: result.url,
                        update: true,
                    });
                });
            })
            .catch((err) => {
                res.render("edit", {
                    error: true,
                });
                console.log(
                    "POST /edit, catch in update/upsert without password:",
                    err
                );
            });
    } else {
        hash(password)
            .then((hashedPw) => {
                return db.updateWithPassword(first, last, email, hashedPw, id);
            })
            .then(() => {
                db.upsertProfile(age || null, city, url, id)
                    .then(() => {
                        console.log(
                            "POST /edit, update age, city, url in database"
                        );
                    })
                    .catch((err) => {
                        console.log(
                            "POST /edit, catch in upsert with password:",
                            err
                        );
                    });
            })
            .then(() => {
                let id = req.session.user.id;
                db.getInfoForUpdate(id).then((result) => {
                    res.render("edit", {
                        first: result.first,
                        last: result.last,
                        email: result.email,
                        age: result.age,
                        city: result.city,
                        url: result.url,
                        update: true,
                    });
                });
            })
            .catch((err) => {
                console.log("POST /edit, catch with password:", err);
                res.render("edit", { error: true });
            });
    }
});

//////////////////// LOGIN SITE ////////////////////

app.get("/login", (req, res) => {
    if (!req.session.user) {
        res.render("login");
    } else {
        res.redirect("/petition");
    }
});

app.post("/login", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let id;
    req.session.user = {};

    if (email != "" && password != "") {
        db.getHashByEmail(email)
            .then((result) => {
                id = result.id;
                return result.password;
            })
            .then((hashedPw) => {
                return compare(password, hashedPw);
            })
            .then((matchValue) => {
                if (matchValue) {
                    req.session.user.id = id;

                    db.hasUserSigned(id)
                        .then((response) => {
                            if (!response.rows[0]) {
                                res.redirect("/petition");
                            } else {
                                req.session.user.idSig = response.rows[0].id;
                                res.redirect("/thanks");
                            }
                        })
                        .catch((err) => {
                            console.log(
                                "POST /login, catch in hasUserSigned:",
                                err
                            );
                            res.render("login", {
                                error: true,
                            });
                        });
                    return req.session.user.id;
                } else {
                    res.render("login", {
                        errorPassword: true,
                    });
                }
            })
            .catch((err) => {
                console.log("POST /login, catch in getHashByEmail:", err);
                res.render("login", {
                    error: true,
                });
            });
    } else {
        res.render("login", {
            error: true,
        });
    }
});

//////////////////// PETITION SITE ////////////////////
app.get("/petition", (req, res) => {
    if (!req.session.user) {
        res.redirect("/register");
    } else if (req.session.user.idSig) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
});

// get signature and user_id and add to database "signatures", set cookie and redirect
app.post("/petition", (req, res) => {
    let signature = req.body.signature;
    let user_id = req.session.user.id;

    if (signature != "") {
        db.addSignee(signature, user_id)
            .then((response) => {
                req.session.user.idSig = response.rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("POST /petition, no signature, catch:", err);
            });
    } else {
        res.render("petition", {
            error: true,
        });
    }
});

//////////////////// PETITION-TEXT SITE ////////////////////

app.get("/petitiontext", (req, res) => {
    let user = req.session.user;

    if (!req.session.user) {
        res.redirect("/register");
        let idSig = req.session.user.idSig;
    } else if (!req.session.user.idSig) {
        res.redirect("/petition");
    } else {
        res.render("petitiontext");
    }
});

//////////////////// THANKS SITE ////////////////////
app.get("/thanks", (req, res) => {
    let currentFirstName;
    let amountOfSignees;
    let currentSignature;
    let user = req.session.user;

    if (!req.session.user) {
        res.redirect("/register");
        let idSig = req.session.user.idSig;
    } else if (!req.session.user.idSig) {
        res.redirect("/petition");
    } else {
        let id = req.session.user.id;
        let idSig = req.session.user.idSig;

        db.getCurrentFirstNameById(id)
            .then((result) => {
                currentFirstName = result.first;
            })
            .catch((err) => {
                console.log(
                    "GET /thanks, catch in getCurrentFirstNameById:",
                    err
                );
            });

        db.getNumberOfSignees()
            .then((result) => {
                amountOfSignees = result;
            })
            .catch((err) => {
                console.log("GET /thanks, catch in getNumberOfSignees:", err);
            });

        db.getCurrentSignatureById(idSig)
            .then((result) => {
                res.render("thanks", {
                    cfn: currentFirstName,
                    amount: amountOfSignees,
                    currentSig: result,
                });
            })
            .catch((err) => {
                console.log(
                    "GET /thanks, catch in getCurrentSignatureById:",
                    err
                );
            });
    }
});

// DELETE SIGNATURE
app.post("/thanks/delete", (req, res) => {
    let user = req.session.user;

    db.deleteSignature(user.id)
        .then(() => {
            delete user.idSig;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("POST /delete signature, error:", err);
        });
});

//////////////////// SIGNERS SITE ////////////////////
app.get("/signers", (req, res) => {
    if (!req.session.user) {
        res.redirect("/register");
    } else if (!req.session.user.idSig) {
        res.redirect("/petition");
    } else {
        db.getFullInfoOfSignees()
            .then((results) => {
                res.render("signers", {
                    fullInfo: results,
                });
            })
            .catch((err) => {
                console.log("error in getFullInfoOfSignees:", err);
            });
    }
});

//////////////////// CITY SITE ////////////////////

app.get("/signers/:city", (req, res) => {
    if (!req.session.user) {
        res.redirect("/register");
    } else if (!req.session.user.idSig) {
        res.redirect("/petition");
    } else {
        let city = req.params.city;
        let currentFirstName;
        let id = req.session.user.id;

        db.getCurrentFirstNameById(id)
            .then((result) => {
                currentFirstName = result.first;
            })
            .catch((err) => {
                console.log(
                    "GET /city, catch in getCurrentFirstNameById:",
                    err
                );
            });

        db.getCityOfSignee(city)
            .then((results) => {
                res.render("city", {
                    cfn: currentFirstName,
                    city: city,
                    fullInfoCities: results,
                    helpers: {
                        toUpperCase(text) {
                            return text.toUpperCase();
                        },
                    },
                });
            })
            .catch((err) => {
                console.log("GET /city, catch in getCityOfSignee:", err);
            });
    }
});

//////////////////// LOGOUT ////////////////////

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});

app.use(function (req, res, next) {
    res.status(404).send("sorry can't find that, 404");
});

// run only when index.js is run by node, not by jest/supertest:
if (require.main === module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("petition server is listening")
    );
}
