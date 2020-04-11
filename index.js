const express = require("express");
const app = express();
const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
const cookieParser = require("cookie-parser");
const db = require("./db.js");

///// MIDDLEWARE /////
app.use(express.static("./public"));

app.use(cookieParser());

app.use(
    express.urlencoded({
        // read req.body, parses
        extended: false,
    })
);

// redirect to petition if on main site
app.get("/", (req, res) => {
    res.redirect("/petition");
    console.log("GET request to main site -> redirected to /petition");
});

///// PETITION SITE /////
// cookie-check
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

// get data from 3 input fields
app.post("/petition", (req, res) => {
    // console.log("req.body.first:", req.body.first);
    // console.log("req.body.last:", req.body.last);
    // console.log("req.body.signature:", req.body.signature);
    let first = req.body.first;
    let last = req.body.last;
    let signature = req.body.signature;

    if (first != "" && last != "" && signature != "") {
        // check if all 3 fields have input
        db.addSignee(first, last, signature) // add to database
            .then(() => {
                console.log("values from 3 input fields added to database");
                q;
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

// app.get("/thanks", (req, res) => {
//     db.getFullNames(`SELECT first FROM signatures`)
//         .then((results) => {
//             let nameArr = [];
//             for (let i = 0; i < results.rows.length; i++) {
//                 let completName = results.rows[i].first;
//                 nameArr.push(completName);
//             }
//             console.log("results.rows:", results.rows);
//             console.log("nameArr:", nameArr);
//             console.log("YAY!");
//         })
//         .catch((err) => {
//             console.log("error in getValues amount:", err);
//         });
// });

/// THANKS SITE /////
app.get("/thanks", (req, res) => {
    if (!req.cookies.signed) {
        res.redirect("/petition");
        console.log(
            "GET request to /thanks without cookie -> redirect to /petition"
        );
    } else {
        console.log("GET request to /thanks with cookie");
        db.getValues(`SELECT COUNT(id) FROM signatures`)
            .then((results) => {
                // console.log("1:", results.rows.length);
                // console.log("2:", results.rows[15]);

                res.render("thanks", {
                    layout: "main",
                    amountOfSigners: results.rows[0].count,
                });
                console.log("amount of signers:", results.rows[0].count);
            })
            .catch((err) => {
                console.log("error in getValues amount:", err);
            });
    }
});

///// SIGNERS SITE /////
app.get("/signers", (req, res) => {
    if (!req.cookies.signed) {
        res.redirect("/petition");
        console.log(
            "GET request to /signers without cookie -> redirect to /petition"
        );
    } else {
        console.log("GET request to /signers with cookie");
        db.getValues(`SELECT first, last FROM signatures`)
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
                console.log("error in getValues names:", err);
            });
    }
});

// const a = db
//     .getFullNames(`SELECT first FROM signatures`)
//     .then((results) => {
//         console.log("results important:", results);
//         console.log("results.rows important:", results.rows);
//     })
//     .catch((err) => {
//         console.log("error in getFullNames:", err);
//     });
// console.log("a:", a);

// const b = db
//     .getLastName(`SELECT last FROM signatures`)
//     .then((results) => {
//         console.log("results important 2:", results);
//         console.log("results.rows important 2:", results.rows);
//     })
//     .catch((err) => {
//         console.log("error in getLastName:", err);
//     });
// console.log("b:", b);

app.listen(8080, () => console.log("petition server is listening"));
