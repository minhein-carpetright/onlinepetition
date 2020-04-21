// redis.js
const redis = require("redis");
const client = redis.createClient(
    process.env.REDIS_URL || { host: "localhost", port: 6379 }
);

const { promisify } = require("util");
///// export functions /////
exports.set = promisify(client.set).bind(client);
exports.get = promisify(client.get).bind(client);
exports.setex = promisify(client.setex).bind(client);
exports.del = promisify(client.del).bind(client);

//////////// DEMO FUNCTIONALITY TALKING REDIS WITH NODE ////////////
client.on("error", (err) => {
    console.log("error in redis:", err);
});

// set takes three arguments: key, value and callback function
client.set("muffin", "blueberry", (err, data) => {
    console.log("log is set:", err, data);
});

// get takes two arguments: key and callback function
client.get("muffin", (err, data) => {
    console.log("get log after set:", err, data);
});

// delete takes two arguments: key and callback function
client.del("muffin", (err, data) => {
    console.log("del log:", err, data);
});

// get takes two arguments: key and callback function
client.get("muffin", (err, data) => {
    console.log("get log after delete:", err, data);
});
