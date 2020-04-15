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
    console.log("GET request to root route -> redirected to /register");
});

//////////////////// REGISTER SITE ////////////////////
app.get("/register", (req, res) => {
    console.log("GET request to register site");
    // const { user } = req.session;

    // if (user) {
    //     res.redirect("/petition");
    //     console.log("has cookie, redirect from /login to /petition");
    // } else {
    //     res.render("login");
    // }
    res.render("register");
});

// get first, last, email and password and add to database, set cookie and redirect
app.post("/register", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;
    let password = req.body.password;

    if (first != "" && last != "" && email != "" && password != "") {
        hash(password)
            .then((hashedPw) => {
                console.log("password hashed in /register:", hashedPw);
                return db.addUser(first, last, email, hashedPw);
            })
            .then((response) => {
                req.session.user = {
                    firstName: first,
                    lastName: last,
                    sigId: response.rows[0].id,
                };
                res.redirect("/petition");
                console.log(
                    "registration successful, 4 input fields added to database, cookie user set, redirect to /petition"
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

//////////////////// LOGIN SITE ////////////////////

app.get("/login", (req, res) => {
    console.log("GET request to login site");
    // const { user } = req.session;
    // if (user) {
    //     res.redirect("/petition");
    //     console.log("has cookie, redirect from /login to /petition");
    // } else {
    res.render("login");
    // }
});

app.post("/login", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    const { user } = req.session;
    let id;
    console.log("email:", email);
    console.log("password:", password);

    if (email != "" && password != "") {
        // grab stored hash from the database to the corresponding email
        db.getHashByEmail(email)
            .then((result) => {
                id = result.rows[0].id;
                return result.rows[0].password;
            })
            // compare hash with login-password
            .then((hashedPw) => {
                return compare(password, hashedPw);
            })
            .then((matchValue) => {
                console.log("match value of compare:", matchValue);
                if (matchValue) {
                    // user.sigId = id;
                    // req.session.user.sigId = result.rows[0].id;
                    // req.session.user.sigId = matchValue.rows[0].id; // store user id in cookie "user"
                    // console.log(
                    //     "req.session.user.sigId:",
                    //     req.session.user.sigId
                    // );
                    res.redirect("/petition");
                    console.log(
                        "hash and entered password match -> redirect to /petition"
                    );
                } else {
                    // if matchValue is false -> rerender login with error message
                    res.render("login", {
                        errorpassword: true,
                    });
                    console.log(
                        "error in login, hash and password do not match"
                    );
                }
                // you will want to redirect to /petition or /thankyou depending on your data flow;
                // do a db query to find out if they've signed
                // if yes, you want to put their sigId in a cookie & redirect to /thanks
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
    // why should signees not be able to see the petition page?!
    // const { currentId } = req.session;
    // if (currentId) {
    //     res.redirect("/thanks");
    // } else {
    res.render("petition");
    console.log("GET request to petition site");
});

// get signature and add to database, set cookie and redirect
// !!! alter your route so that you pass user from the cookie to your query instead of first and last name !!!
app.post("/petition", (req, res) => {
    let signature = req.body.signature;

    if (signature != "") {
        db.addSignee(signature)
            .then((response) => {
                req.session.currentId = response.rows[0].id; // set cookie on current id
                // console.log("current value of currentId cookie:", response.rows[0].id);
                console.log("session object after POST-request:", req.session);
                res.redirect("/thanks");
                console.log(
                    "petition signed, values from 3 input fields added to database, redirect to /thanks"
                );
            })
            .catch((err) => {
                console.log("error, not all 3 fields filled out:", err);
            });
    } else {
        res.render("petition", {
            error: true,
            // how to scroll down to the error message/bottom of page automatically?
        });
        console.log("input fields on /petition not complete");
    }
});

//////////////////// THANKS SITE ////////////////////
app.get("/thanks", (req, res) => {
    // thank signee and show number of signees and signature
    const { currentId } = req.session;
    let currentFirstName;
    let amountOfSignees;
    let currentSignature;

    if (currentId) {
        console.log("GET request to /thanks with cookies");

        db.getCurrentFirstNameById(currentId)
            .then((result) => {
                currentFirstName = result;
                console.log("current first name:", currentFirstName);
            })
            .catch((err) => {
                console.log("error in getCurrentFirstNameById:", err);
            });

        db.getNumberOfSignees()
            .then((result) => {
                amountOfSignees = result;
                console.log("number of signees:", amountOfSignees);
            })
            .catch((err) => {
                console.log("error in getNumberOfSignees amount:", err);
            });

        db.getCurrentSignatureById(currentId)
            .then((result) => {
                currentSignature = result;
                console.log("current signature:", currentSignature);
                // render current first name, amount of signees and current signature
                res.render("thanks", {
                    cfn: currentFirstName,
                    amount: amountOfSignees,
                    currentSig: currentSignature,
                });
            })
            .catch((err) => {
                console.log("error in getCurrentSignatureById:", err);
            });
    } else {
        // if no cookie redirect to /petition
        console.log(
            "GET request to /thanks without cookie -> redirect to /petition"
        );
        res.redirect("/petition");
    }
});

//////////////////// SIGNERS SITE ////////////////////
app.get("/signers", (req, res) => {
    const { currentId } = req.session;

    if (currentId) {
        // show first and last names of other signees
        console.log("GET request to /signers with cookie");

        db.getFullNamesOfSignees()
            .then((results) => {
                // loop through table-names and push them into an array
                let namesArr = [];
                for (let i = 0; i < results.rows.length; i++) {
                    let completeName =
                        results.rows[i].first + " " + results.rows[i].last;
                    namesArr.push(completeName);
                }
                // console.log("results.rows:", results.rows);
                // console.log("namesArr:", namesArr);
                res.render("signers", {
                    fullNames: namesArr,
                });
            })
            .catch((err) => {
                console.log("error in getFullNamesOfSignees:", err);
            });
    } else {
        // if no cookie redirect to /petition
        console.log(
            "GET request to /signers without cookie -> redirect to /petition"
        );
        res.redirect("/petition");
    }
});

// log out user:
// req.session = null;

app.use(function (req, res, next) {
    res.status(404).send("sorry can't find that, 404");
});

app.listen(8080, () => console.log("petition server is listening"));
