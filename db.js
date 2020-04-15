const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// db is an object, has one method: query()

// INSERT FIRST AND LAST NAME, EMAIL AND PASSWORD INTO DATABASE "USERS"
module.exports.addUser = (first, last, email, password) => {
    return db.query(
        `
    INSERT INTO users (first, last, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING id;`,
        [first, last, email, password]
    );
};

// INSERT SIGNATURE INTO DATABASE "SIGNATURES"
module.exports.addSignee = (signature, user_id) => {
    return db.query(
        `
    INSERT INTO signatures (signature, user_id)
    VALUES ($1, $2)
    RETURNING id;`,
        [signature, user_id]
    );
};

// RETURN HASH OF USERS FOR COMPARISON
module.exports.getHashByEmail = (email) => {
    // return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return db.query(`SELECT password, id FROM users WHERE email = $1`, [email]);
    // .then((result) => {
    //     return result.rows[0].password;
    // });
};

// RETURN NUMBER OF SIGNEES
module.exports.getNumberOfSignees = () => {
    return db.query(`SELECT COUNT(id) FROM users`).then((result) => {
        return result.rows[0].count;
    });
};

// RETURN FIRST AND LAST NAMES
module.exports.getFullNamesOfSignees = () => {
    return db.query(`SELECT first, last FROM users`);
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
        .query(`SELECT first FROM users WHERE id = $1`, [id])
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
