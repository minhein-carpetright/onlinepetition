const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// db is an object, has one method: query()

module.exports.addSignee = (first, last, signature) => {
    return db.query(
        `
    INSERT INTO signatures (first, last, signature)
    VALUES ($1, $2, $3)`,
        [first, last, signature]
    );
    console.log(first, last, signature);
    console.log([first, last, signature]);
    console.log($1, $2, $3);
};

module.exports.getNumberOfSignees = () => {
    return db.query(`SELECT COUNT(id) FROM signatures`);
};

module.exports.getFullNamesOfSignees = () => {
    return db.query(`SELECT first, last FROM signatures`);
};

// EXPORT BY FIRST NAME (if firstName is inserted I get every row with that name)
// module.exports.getByFirstName = (firstName) => {
//     return db.query(`SELECT * FROM signatures WHERE first = $1`, [firstName]);
// };

// EXPORT BY ID (if id is inserted I get the whole row)
// module.exports.getById = (id) => {
//     return db.query(`SELECT * FROM signatures WHERE id = $1`, [id]);
// };

// GETS EVERYTHING FROM THE DATABASE
// module.exports.getValues = (query) => {
//     return db.query(query);
// };

// DATA OF LAST/HIGHEST ID
// SELECT * FROM signatures ORDER BY id DESC LIMIT 1
// DESC = descending
// LIMIT 1: just one index
// can also be done in index.js
// module.exports.getHighestId = () => {
//     return db.query(`SELECT * FROM signatures ORDER BY id DESC LIMIT 1`);
// };
