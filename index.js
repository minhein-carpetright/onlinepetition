const express = require("express");
const app = express();
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const { addEntry } = require("./db.js");
const db = require("./db.js");
const csurf = require("csurf");
const { hash, compare } = require("./bc");
const helmet = require("helmet");

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

// redirect to petition if on main site
app.get("/", (req, res) => {
    res.redirect("/register");
    console.log("GET request to root route -> redirect to /register");
});

//////////////////// REGISTER SITE ////////////////////
app.get("/register", (req, res) => {
    console.log("GET request to /register");
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
                    // set cookie "user"
                    // firstName: first,
                    // lastName: last,
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
                console.log("error in POST register:", err);
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
    console.log("GET request to /profile, cookie:", req.session.user);

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
    // if age is not filled out the databank doesn't store the other values - to prevent this:
    checkAge = (age) => {
        if (age == "") {
            return null;
        } else {
            return age;
        }
    };
    // easier solution to the function above: pass as parameter `age || null`

    const city = req.body.city;
    const url = req.body.homepage;
    let user_id = req.session.user.id;
    // console.log("user_id:", user_id);
    // console.log("req.session.user.id:", req.session.user.id);

    if (
        url != "" &&
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {
        res.render("profile", {
            error: true,
        });
    } else {
        db.addProfile(age, city, url, user_id)
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
                // req.session.user.idProf = user_id; // set cookie "idProf" on user_id in "user_profiles"
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
                    "error in POST /profile, redirect to /petition",
                    err
                );
            });
    }
});

//////////////////// LOGIN SITE ////////////////////

app.get("/login", (req, res) => {
    console.log("GET request to login site, cookie:", req.session.user);

    if (req.session.user) {
        res.redirect("/petition");
        console.log("has cookie, redirect from /login to /petition");
    } else {
        res.render("login");
    }
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    req.session.user = {};
    console.log(
        "POST request to login site, cookie after {}:",
        req.session.user
    );
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
                        "POST to /login, cookie in matchValue before:",
                        req.session.user
                    );
                    req.session.user.id = id;
                    console.log(
                        "POST to /login, cookie in matchValue after password match in login:",
                        req.session.user
                    );
                    return req.session.user.id;
                } else {
                    // if matchValue is false -> rerender login with error message
                    res.render("login", {
                        errorpassword: true,
                    });
                    console.log(
                        "error in login, hash and password do not match"
                    );
                }
            })
            // check for signature:
            .then(() => {
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
                            req.session.user.idSig = response.rows[0].id; // set cookie idSig
                            console.log(
                                "POST /login check for signature after set idSig:",
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
                    });
            })
            // if matchValue is false -> rerender
            .catch((err) => {
                res.render("login", {
                    error: true,
                });
                console.log("error in login", err);
            });
    } else {
        res.render("login", {
            error: true,
        });
        console.log("2 input fields on /login not complete");
    }
});

//////////////////// PETITION SITE ////////////////////
app.get("/petition", (req, res) => {
    console.log("GET request to /petition, cookie:", req.session.user);

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
                console.log("error, no signature:", err);
            });
    } else {
        res.render("petition", {
            error: true,
            // how to scroll down to the error message/bottom of page automatically?
        });
        console.log("signature on /petition not complete");
    }
});

//////////////////// THANKS SITE ////////////////////
// thank signee and show number of signees and signature

app.get("/thanks", (req, res) => {
    console.log(
        "GET  request to /thanks, cookie at beginning of route:",
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
                console.log("error in getCurrentFirstNameById:", err);
            });

        db.getNumberOfSignees()
            .then((result) => {
                amountOfSignees = result;
                // console.log("number of signees:", amountOfSignees);
            })
            .catch((err) => {
                console.log("error in getNumberOfSignees amount:", err);
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
                console.log("error in getCurrentSignatureById:", err);
            });
        console.log(
            "GET to /thanks, cookie at end of route:",
            req.session.user
        );
    }
});

//////////////////// SIGNERS SITE ////////////////////
app.get("/signers", (req, res) => {
    console.log(
        "GET request to /signers, cookie at beginning of route:",
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
        console.log("GET request to /signers with cookie", req.session.user);

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
        console.log(
            "GET request to /signers, cookie after catch:",
            req.session.user
        );
    }
});

app.get("/signers/:city", (req, res) => {
    console.log(
        "GET request to /city, cookie at beginning of route:",
        req.session.user
    );

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
        console.log("GET request to /city with cookie", req.session.user);
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
                console.log("error in getCurrentFirstNameById:", err);
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
                console.log("error in getCityOfSignee:", err);
            });
        console.log(
            "GET request to /city, cookie after catch:",
            req.session.user
        );
    }
});

app.use(function (req, res, next) {
    res.status(404).send("sorry can't find that, 404");
});

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server is listening")
);
