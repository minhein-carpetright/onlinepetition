const express = require("express");
const app = express();
// exports.app = app;
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const { addEntry } = require("./db.js");
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

// app.use((req, res, next) => {
//     console.log("I am running on every request!");
//     if (!req.session.user && req.url != "/register" && req.url != "/login") {
//         res.redirect("/register");
//     } else {
//         next();
//     }
// });

app.use(express.static("./public"));

app.use(function (err, req, res, next) {
    console.error("error in middleware:", err.stack);
    res.status(500).send("Something broke, status code 500!");
});

//////////////////// ROUTES ////////////////////

// redirect to petition if on main site
app.get("/", (req, res) => {
    res.redirect("/register");
    console.log("GET / root route -> redirect to /register");
});

//////////////////// REGISTER SITE ////////////////////
app.get("/register", (req, res) => {
    console.log("GET /register");
    if (req.session.user) {
        res.redirect("/petition");
        console.log(
            "has cookie, redirect from /register to /petition, cookie:",
            req.session.user
        );
    } else {
        res.render("register");
    }
});

// get first, last, email and password and add to database, set cookie and redirect
app.post("/register", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;
    let password = req.body.password;
    req.session.user = {};

    if (first != "" && last != "" && email != "" && password != "") {
        hash(password)
            .then((hashedPw) => {
                console.log("password hashed in /register:", hashedPw);
                return db.addUser(first, last, email, hashedPw);
            })
            .then((response) => {
                req.session.user = {
                    id: response.rows[0].id,
                };
                console.log(
                    "cookie 'user' in POST /register:",
                    req.session.user
                );
                res.redirect("/profile");
                console.log(
                    "registration successful, 4 input fields added to database, cookie 'user' set, redirect to /profile"
                );
            })
            .catch((err) => {
                console.log("POST /register, catch:", err);
                res.render("register", { error: true });
            });
    } else {
        res.render("register", {
            error: true,
        });
        console.log("4 input fields on /register not complete");
    }
});

//////////////////// PROFILE SITE ////////////////////
app.get("/profile", (req, res) => {
    console.log("GET /profile, cookie:", req.session.user);

    if (!req.session.user) {
        res.redirect("/register");
        console.log(
            "has no cookie, redirect from /profile to /register, cookie:",
            req.session.user
        );
    } else {
        res.render("profile");
        console.log("cookie 'user' in GET /profile:", req.session.user);
    }
});

app.post("/profile", (req, res) => {
    console.log(
        "POST to /profile, cookie at beginning of route:",
        req.session.user
    );
    let age = req.body.age;

    const city = req.body.city;
    const url = req.body.url;
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
                console.log(
                    "POST to /profile, cookie before change:",
                    req.session.user
                );
                console.log(
                    "look at what database reveals before setting cookie idProf:",
                    response.rows[0]
                );
                req.session.user.idProf = response.rows[0].id; // set cookie "idProf" on id in "user_profiles"
                console.log("database after cookie is set:", response.rows[0]);
                console.log(
                    "POST to /profile, cookie after change with idProf:",
                    req.session.user
                );
                res.redirect("/petition");
                console.log(
                    "profile info inserted in database, redirect to /petition:"
                );
            })
            .catch((err) => {
                res.redirect("/petition");
                console.log(
                    "POST /profile, redirect to /petition, catch:",
                    err
                );
            });
    }
});

//////////////////// EDIT SITE ////////////////////
app.get("/profile/edit", (req, res) => {
    console.log("GET /edit, cookie:", req.session.user);

    if (!req.session.user) {
        res.redirect("/register");
        console.log(
            "has no cookie, redirect from /edit to /register, cookie:",
            req.session.user
        );
    } else {
        let id = req.session.user.id;
        db.getInfoForUpdate(id)
            .then((result) => {
                // console.log("result in getInfoForUpdate:", result);
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
        console.log(
            "GET /edit, existing values in fields ready for update, cookie:",
            req.session.user
        );
    }
});

app.post("/profile/edit", (req, res) => {
    console.log(
        "POST to /edit, cookie at beginning of route:",
        req.session.user
    );
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
            console.log("index.js /edit, first/last or email empty");
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
            console.log("index.js /edit, bad url");
        });
    } else if (password == "") {
        db.updateFirstLastEmail(first, last, email, id)
            .then(() => {
                console.log("update first, last, email in database");
                return db.upsertProfile(age || null, city, url, id);
            })
            .then(() => {
                console.log("update age, city, url in database");
            })
            .then(() => {
                let id = req.session.user.id;
                db.getInfoForUpdate(id).then((result) => {
                    // console.log("result in getInfoForUpdate:", result);
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
                console.log(
                    "POST /edit, update & upsert without password, update-message, cookie:",
                    req.session.user
                );
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
                console.log("POST /edit, hashed password:", hashedPw);
                return db.updateWithPassword(first, last, email, hashedPw, id);
            })
            .then(() => {
                console.log(
                    "POST /edit, update first, last, email, password in database"
                );
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
                    // console.log("result in getInfoForUpdate:", result);
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
                console.log(
                    "POST /edit, update/upsert with password, rendering success, cookie:",
                    req.session.user
                );
            })
            .catch((err) => {
                console.log("POST /edit, catch with password:", err);
                res.render("edit", { error: true });
            });
    }
});

//////////////////// LOGIN SITE ////////////////////

app.get("/login", (req, res) => {
    console.log("GET /login, cookie:", req.session.user);

    if (!req.session.user) {
        res.render("login");
        console.log("GET /login, render /login, no cookie:", req.session.user);
    } else {
        res.redirect("/petition");
        console.log(
            "has cookie, redirect from /login to /petition, cookie:",
            req.session.user
        );
    }
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    req.session.user = {};
    console.log("POST /login, cookie after {}:", req.session.user);
    let id;

    if (email != "" && password != "") {
        // grab stored hash from the database to the corresponding email:
        db.getHashByEmail(email)
            .then((result) => {
                console.log("result getHashByEmail in index.js:", result); // logs password & id in object
                id = result.id;
                return result.password;
            })
            // compare hash with login-password:
            .then((hashedPw) => {
                return compare(password, hashedPw);
            })
            .then((matchValue) => {
                console.log("match value of compare:", matchValue); // true or false
                if (matchValue) {
                    console.log(
                        "POST /login, cookie in matchValue before:",
                        req.session.user
                    );
                    req.session.user.id = id;
                    console.log(
                        "POST /login, cookie in matchValue after password match in login:",
                        req.session.user
                    );
                    db.hasUserSigned(id)
                        .then((response) => {
                            if (!response.rows[0]) {
                                res.redirect("/petition");
                                console.log(
                                    "POST /login, cookie idSig not there, redirect to /petition, cookie:",
                                    req.session.user
                                );
                            } else {
                                console.log(
                                    "POST /login check for signature before set idSig:",
                                    req.session.user
                                );
                                req.session.user.idSig = response.rows[0].id;
                                console.log(
                                    "POST /login check for signature after set idSig, redirect to /thanks:",
                                    req.session.user
                                );
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
                    // if matchValue is false -> rerender login with error message
                    res.render("login", {
                        errorPassword: true,
                    });
                    console.log(
                        "POST /login, hash and password do not match, rerender /login with error message, cookie:",
                        req.session.user
                    );
                }
            })
            .catch((err) => {
                res.render("login", {
                    error: true,
                });
                console.log("POST /login, catch in getHashByEmail:", err);
            });
    } else {
        res.render("login", {
            error: true,
        });
        console.log(
            "2 input fields on /login not complete or falsy, rerender /login with error message"
        );
    }
});

//////////////////// PETITION SITE ////////////////////
app.get("/petition", (req, res) => {
    console.log("GET /petition, cookie:", req.session.user);

    if (!req.session.user) {
        res.redirect("/register");
        console.log(
            "no cookie, redirect from GET /petition to /register, cookie:",
            req.session.user
        );
    } else if (req.session.user.idSig) {
        res.redirect("/thanks");
        console.log(
            "GET /petition, has already signed/idSig, redirect to /thanks, cookie:",
            req.session.user
        );
    } else {
        res.render("petition");
    }
});

// get signature and user_id and add to database "signatures", set cookie and redirect
app.post("/petition", (req, res) => {
    console.log(
        "POST to /petition, cookie at beginning of route:",
        req.session.user
    );
    let signature = req.body.signature;
    let user_id = req.session.user.id;
    console.log("user_id:", user_id);

    if (signature != "") {
        db.addSignee(signature, user_id)
            .then((response) => {
                // console.log("response.rows[0]:", response.rows[0]); // do I need this line?
                // console.log("user_id:", user_id); // do I need this line?
                console.log(
                    "POST to /petition, cookie before change:",
                    req.session.user
                );
                req.session.user.idSig = response.rows[0].id; // set cookie "idSig" on id in "signatures"
                console.log(
                    "POST to /petition, cookie after change with idSig:",
                    req.session.user
                );
                res.redirect("/thanks");
                console.log(
                    "petition signed, signature added to database, redirect to /thanks"
                );
            })
            .catch((err) => {
                console.log("POST /petition, no signature, catch:", err);
            });
    } else {
        res.render("petition", {
            error: true,
            // how to scroll down to the error message/bottom of page automatically?
        });
        console.log("signature on /petition not complete");
    }
});

//////////////////// PETITION-TEXT SITE ////////////////////

app.get("/petitiontext", (req, res) => {
    console.log(
        "GET /petitiontext, cookie at beginning of route:",
        req.session.user
    );
    let user = req.session.user;

    if (!req.session.user) {
        res.redirect("/register");
        console.log(
            "no cookie, redirect from GET /petitiontext to /register, cookie:",
            req.session.user
        );
        let idSig = req.session.user.idSig;
    } else if (!req.session.user.idSig) {
        res.redirect("/petition");
        console.log(
            "GET /petitiontext, has not signed, redirect to /petition, cookie:",
            req.session.user
        );
    } else {
        res.render("petitiontext");
    }
});

//////////////////// THANKS SITE ////////////////////
// thank signee and show number of signees and signature

app.get("/thanks", (req, res) => {
    console.log(
        "GET  /thanks, cookie at beginning of route:",
        req.session.user
    );
    let currentFirstName;
    let amountOfSignees;
    let currentSignature;
    let user = req.session.user;

    if (!req.session.user) {
        res.redirect("/register");
        console.log(
            "no cookie, redirect from GET /thanks to /register, cookie:",
            req.session.user
        );
        let idSig = req.session.user.idSig;
    } else if (!req.session.user.idSig) {
        res.redirect("/petition");
        console.log(
            "GET /thanks, has not signed, redirect to /petition, cookie:",
            req.session.user
        );
    } else {
        let id = req.session.user.id;

        db.getCurrentFirstNameById(id)
            .then((result) => {
                currentFirstName = result.first;
                // console.log("current first name:", currentFirstName);
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
                // console.log("number of signees:", amountOfSignees);
            })
            .catch((err) => {
                console.log("GET /thanks, catch in getNumberOfSignees:", err);
            });

        let idSig = req.session.user.idSig;
        db.getCurrentSignatureById(idSig)
            .then((result) => {
                // console.log("result of getCurrentSignatureById:", result);
                // currentSignature = result.signature;
                // console.log("current signature:", currentSignature);
                // render current first name, amount of signees and current signature:
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
        console.log(
            "GET to /thanks, cookie at end of route:",
            req.session.user
        );
    }
});

// DELETE SIGNATURE
app.post("/thanks/delete", (req, res) => {
    let user = req.session.user;
    db.deleteSignature(user.id)
        .then(() => {
            delete user.idSig;
            console.log(
                "req.session.user after idSig got deleted:",
                req.session.user
            );
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("POST /delete signature, error:", err);
        });
    console.log(
        "POST /thanks, signature and idSig deleted, redirect to /petition"
    );
});

//////////////////// SIGNERS SITE ////////////////////
app.get("/signers", (req, res) => {
    console.log(
        "GET /signers, cookie at beginning of route:",
        req.session.user
    );

    if (!req.session.user) {
        res.redirect("/register");
        console.log(
            "no cookie, redirect from GET /signers to /register, cookie:",
            req.session.user
        );
        let idSig = req.session.user.idSig; // necessary?
    } else if (!req.session.user.idSig) {
        res.redirect("/petition");
        console.log(
            "GET /signers, has not signed, redirect to /petition, cookie:",
            req.session.user
        );
    } else {
        // show first and last names, age, cities and homepage of other signees
        console.log("GET /signers with cookie", req.session.user);

        db.getFullInfoOfSignees()
            .then((results) => {
                // console.log("results of getFullInfoOfSignees", results);
                res.render("signers", {
                    fullInfo: results,
                });
            })
            .catch((err) => {
                console.log("error in getFullInfoOfSignees:", err);
            });
        console.log("GET /signers, cookie after catch:", req.session.user);
    }
});

//////////////////// CITY SITE ////////////////////

app.get("/signers/:city", (req, res) => {
    console.log("GET /city, cookie at beginning of route:", req.session.user);

    if (!req.session.user) {
        res.redirect("/register");
        console.log(
            "no cookie, redirect from GET /city to /register, cookie:",
            req.session.user
        );
        let idSig = req.session.user.idSig; // necessary?
    } else if (!req.session.user.idSig) {
        res.redirect("/petition");
        console.log(
            "GET /city, has not signed, redirect to /petition, cookie:",
            req.session.user
        );
    } else {
        // show first and last names, age and homepage of other signees in the same city
        console.log("GET /city with cookie", req.session.user);
        const city = req.params.city;
        console.log("city:", city);

        let currentFirstName;
        let id = req.session.user.id;
        db.getCurrentFirstNameById(id)
            .then((result) => {
                currentFirstName = result.first;
                // console.log("current first name:", currentFirstName);
            })
            .catch((err) => {
                console.log(
                    "GET /city, catch in getCurrentFirstNameById:",
                    err
                );
            });

        db.getCityOfSignee(city)
            .then((results) => {
                // console.log("results of getCityOfSignee:", results);
                res.render("city", {
                    layout: "main", // delete later
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
        console.log("GET /city, cookie after catch:", req.session.user);
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
