const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// db is an object, has one method: query()

module.exports.addSignee = (first, last, signature) => {
    return db.query(
        `
    INSERT INTO signatures (first, last, signature)
    VALUES ($1, $2, $3)`,
        // $ grab user's input, refer to arguments given to function, done to prevent SQL injection attacks
        [first, last, signature]
        // array is only there to work with $-syntax
    );
};

module.exports.getValues = (query) => {
    return db.query(query);
};

// this is how our database-query will look like with a function "getCities":
// module.exports.getCities = () => {
//     return db.query(`SELECT * FROM cities`);
// };

// ANOTHER EX.:
// db.query('SELECT * FROM actors').then(function (result) {
//     console.log(result.rows);
// }).catch(function (err) {
//     console.log(err);
// });

// ANOTHER EX. PREVENTING SQL INJECTION:
// function getActorByName(actorName) {
//     return db.query(
//         `SELECT * FROM actors WHERE name = $1`,
//         [actorName]
//     );
// }

// module.exports.getFullNames = (firstName) => {
//     return db.query(`SELECT * FROM signatures WHERE first = $1`, [firstName]);
// };

// function getLastName(lastName) {
//     return db.query(`SELECT * FROM signatures WHERE last = $2`, [lastName]);
// }
