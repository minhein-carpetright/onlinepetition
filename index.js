const express = require("express");
const app = express();
const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
const cookieParser = require("cookie-parser");
const db = require("./db.js");

//////////////////// MIDDLEWARE ////////////////////
app.use(express.static("./public"));

app.use(cookieParser());

app.use(
    express.urlencoded({
        extended: false,
    }) // read req.body, parses
);

app.use(function (err, req, res, next) {
    console.error("error in middleware:", err.stack);
    res.status(500).send("Something broke, status code 500!");
});

// redirect to petition if on main site
app.get("/", (req, res) => {
    res.redirect("/petition");
    console.log("GET request to main site -> redirected to /petition");
});

//////////////////// PETITION SITE ////////////////////
// if cookie redirect to /thanks
app.get("/petition", (req, res) => {
    if (!req.cookies.signed) {
        res.render("petition", {
            layout: "main",
        });
        console.log("GET request to petition site & no cookie");
    } else {
        res.redirect("/thanks"); // signees are not supposed to see /petition-page again?!
    }
});

// get data from 3 input fields, add to database, set cookie and redirect
app.post("/petition", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let signature = req.body.signature;

    if (first != "" && last != "" && signature != "") {
        // check if all 3 fields have input
        db.addSignee(first, last, signature) // add to database
            .then(() => {
                console.log("values from 3 input fields added to database");
            })
            .catch((err) => {
                console.log("error, not all 3 fields filled out:", err);
            });
        res.cookie("signed", true); // set cookie
        res.redirect("/thanks"); // redirect to thanks-site
        console.log(
            "petition signed, cookie 'signed' set, redirect to /thanks"
        );
    } else {
        res.render("petition", {
            layout: "main",
            error: true, // send error message
            // how to scroll down to the error message/bottom of page automatically?
        });
        console.log("input fields on /petition not complete");
    }
});

//////////////////// THANKS SITE ////////////////////
// if no cookie redirect to /petition
app.get("/thanks", (req, res) => {
    if (!req.cookies.signed) {
        res.redirect("/petition");
        console.log(
            "GET request to /thanks without cookie -> redirect to /petition"
        );
    } else {
        // thank signee and show number of signees
        console.log("GET request to /thanks with cookie");
        db.getNumberOfSignees()
            .then((results) => {
                res.render("thanks", {
                    layout: "main",
                    amountOfSigners: results.rows[0].count,
                });
                console.log("amount of signers:", results.rows[0].count);
            })
            .catch((err) => {
                console.log("error in getNumberOfSignees amount:", err);
            });
    }
});

//////////////////// SIGNERS SITE ////////////////////
// if no cookie redirect to /petition
app.get("/signers", (req, res) => {
    if (!req.cookies.signed) {
        res.redirect("/petition");
        console.log(
            "GET request to /signers without cookie -> redirect to /petition"
        );
    } else {
        // show signee first and last names of other signees
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
                    layout: "main",
                    fullNames: namesArr,
                });
            })
            .catch((err) => {
                console.log("error in getFullNamesOfSignees:", err);
            });
    }
});

app.use(function (req, res, next) {
    res.status(404).send("sorry can't find that, 404");
});

app.listen(8080, () => console.log("petition server is listening"));
