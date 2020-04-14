const express = require("express");
const app = express();
const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
const cookieSession = require("cookie-session");
const { addEntry } = require("./db.js");
const db = require("./db.js");
const csurf = require("csurf");

//////////////////// MIDDLEWARE ////////////////////
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
    res.redirect("/petition");
    console.log("GET request to root route -> redirected to /petition");
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

// get data from 3 input fields, add to database, set cookie and redirect
app.post("/petition", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let signature = req.body.signature;

    if (first != "" && last != "" && signature != "") {
        db.addSignee(first, last, signature)
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
