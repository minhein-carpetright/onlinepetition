const { app } = require("../index");
const {
    requireLoggedOutUser,
    requireNoSignature,
    requireSignature,
} = require("../middleware");
// Require also everything else we need (`db` etc.)

// POST and GET routes /register and /login here
