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
        [age, city, url, user_id]
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
    return db.query(`SELECT id FROM signatures WHERE user_id = $1`, [id]);
};

////////////////////////// PETITION //////////////////////////

// INSERT SIGNATURE INTO DATABASE "SIGNATURES"
module.exports.addSignee = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2)
        RETURNING id;`,
        [signature, user_id]
    );
};

////////////////////////// THANKS //////////////////////////

// RETURN FIRST NAME OF CURRENT/LAST ID
module.exports.getCurrentFirstNameById = (id) => {
    return db
        .query(`SELECT first FROM users WHERE id = $1`, [id])
        .then((result) => {
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
        .query(
            `SELECT signature
                FROM signatures
                WHERE id = $1`,
            [id]
        )
        .then((result) => {
            return result.rows[0].signature;
        });
};

module.exports.deleteSignature = (user_id) => {
    return db.query(
        `DELETE
        FROM signatures
        WHERE user_id = $1`,
        [user_id]
    );
};

////////////////////////// SIGNEES //////////////////////////

// RETURN FIRST AND LAST NAMES, AGE, CITY, URL
module.exports.getFullInfoOfSignees = () => {
    return db
        .query(
            `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
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

// RETURN FIRST AND LAST NAMES, AGE, CITY, URL IF THERE IS A SIGNATURE
module.exports.getCityOfSignee = (city) => {
    return db
        .query(
            `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
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

////////////////////////// UPDATE //////////////////////////

// RETURN ALL INFO EXCEPT PASSWORD FOR UPDATE-FIELDS
module.exports.getInfoForUpdate = (id) => {
    return db
        .query(
            `
            SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
            FROM users
            LEFT OUTER JOIN user_profiles
            ON users.id = user_profiles.user_id
            WHERE users.id = $1`,
            [id]
        )
        .then((result) => {
            return result.rows[0];
        });
};

// RETURN FIRST, LAST, EMAIL & ID FOR UPDATE-FIELDS
module.exports.updateFirstLastEmail = (first, last, email, id) => {
    return db.query(
        `UPDATE users SET first = $1, last = $2, email = $3
        WHERE id = $4`,
        [first, last, email, id]
    );
};

// RETURN FIRST, LAST, EMAIL, PASSWORD & ID FOR UPDATE-FIELDS
module.exports.updateWithPassword = (first, last, email, password, id) => {
    return db.query(
        `UPDATE users SET first = $1, last = $2, email = $3, password = $4
        WHERE id = $5`,
        [first, last, email, password, id]
    );
};

// RETURN AGE, CITY, URL & USER_ID FOR INSERT/UPDATE-FIELDS
module.exports.upsertProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) DO UPDATE SET age = $1, city = $2, url = $3`,
        [age, city, url, user_id]
    );
};
