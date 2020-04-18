const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);
// db is an object, has one method: query()

////////////////////////// REGISTER //////////////////////////
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

////////////////////////// PROFILE //////////////////////////
// INSERT AGE, CITY AND URL INTO DATABASE "USER_PROFILES"
module.exports.addProfile = (age, city, url, user_id) => {
    return db.query(
        `
        INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id;`,
        [checkAge(age), city, url, user_id]
    );
};

////////////////////////// LOGIN //////////////////////////
// RETURN HASH OF USERS FOR COMPARISON
module.exports.getHashByEmail = (email) => {
    return db
        .query(
            `SELECT password, id
        FROM users
        WHERE email = $1`,
            [email]
        )
        .then((result) => {
            return result.rows[0];
        });
};

// HAS THE USER SIGNED?
module.exports.hasUserSigned = (id) => {
    return db
        .query(
            `
        SELECT id FROM signatures WHERE user_id = $1;`,
            [id]
        )
        .then((result) => {
            return result.rows[0];
        });
};

// module.exports.hasUserSigned = (email) => {
//     return db
//         .query(
//             `SELECT user.email, signatures.user_id
//             FROM users
//             JOIN signatures
//             ON users.id = signatures.user_id
//             WHERE email = $1`,
//             [email]
//         )
//         .then((result) => {
//             return result.rows[0];
//         });
// };
// Change the query that retrieves information from the users table by email address so that it also gets data from the signatures table. Thus you will be able to know whether the user has signed the petition or not as soon as they log in.

////////////////////////// PETITION //////////////////////////
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

// RETURN FIRST NAME OF CURRENT/LAST ID
module.exports.getCurrentFirstNameById = (id) => {
    return db
        .query(`SELECT first FROM users WHERE id = $1`, [id])
        .then((result) => {
            // return result.rows[0].first;
            return result.rows[0];
        });
};

// RETURN NUMBER OF SIGNEES
module.exports.getNumberOfSignees = () => {
    return db.query(`SELECT COUNT(id) FROM signatures`).then((result) => {
        return result.rows[0].count;
    });
};

// RETURN SIGNATURE OF CURRENT/LAST ID
module.exports.getCurrentSignatureById = (id) => {
    return db
        .query(`SELECT signature FROM signatures WHERE id = $1`, [id])
        .then((result) => {
            return result.rows[0].signature;
        });
};

////////////////////////// SIGNEES //////////////////////////
// RETURN FIRST AND LAST NAMES, AGE, CITY, URL
module.exports.getFullInfoOfSignees = () => {
    return db
        .query(
            `
        SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
        FROM signatures
        JOIN users
        ON users.id = signatures.user_id
        LEFT OUTER JOIN user_profiles
        ON users.id = user_profiles.user_id;`
        )
        .then((result) => {
            return result.rows;
        });
};

////////////////////////// CITY //////////////////////////
// RETURN FIRST AND LAST NAMES, AGE, CITY, URL
module.exports.getCityOfSignee = (city) => {
    return db
        .query(
            `
        SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
        FROM signatures
        JOIN users
        ON users.id = signatures.user_id
        LEFT OUTER JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE LOWER(user_profiles.city) = LOWER($1)`,
            [city]
        )
        .then((result) => {
            return result.rows;
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
