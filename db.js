const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// db is an object, has one method: query()

// INSERT FIRST AND LAST NAME AND SIGNATURE INTO DATABASE
module.exports.addSignee = (first, last, signature) => {
    return db.query(
        `
    INSERT INTO signatures (first, last, signature)
    VALUES ($1, $2, $3)
    RETURNING id;`,
        [first, last, signature]
    );
    console.log(first, last, signature);
    console.log([first, last, signature]);
    console.log($1, $2, $3);
};

// RETURN NUMBER OF SIGNEES
module.exports.getNumberOfSignees = () => {
    return db.query(`SELECT COUNT(id) FROM signatures`).then((result) => {
        return result.rows[0].count;
    });
};

// RETURN FIRST AND LAST NAMES
module.exports.getFullNamesOfSignees = () => {
    return db.query(`SELECT first, last FROM signatures`);
};

// RETURN SIGNATURE OF CURRENT/LAST ID
module.exports.getCurrentSignatureById = (id) => {
    return db
        .query(`SELECT signature FROM signatures WHERE id = $1`, [id])
        .then((result) => {
            return result.rows[0].signature;
        });
};

// RETURN FIRST NAME OF CURRENT/LAST ID
module.exports.getCurrentFirstNameById = (id) => {
    return db
        .query(`SELECT first FROM signatures WHERE id = $1`, [id])
        .then((result) => {
            return result.rows[0].first;
        });
};

// EXPORT BY FIRST NAME (if firstName is inserted I get every row with that name)
// module.exports.getByFirstName = (firstName) => {
//     return db.query(`SELECT * FROM signatures WHERE first = $1`, [firstName]);
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
