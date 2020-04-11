const cluster = require("cluster");
const os = require("os");

cluster.setupMaster({
    exec: "index.js"
});

console.log("About to create a worker for every cpu");

for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
}

cluster.on("exit", function(worker) {
    console.log(worker.process.pid + " bit the dust");
    cluster.fork();
});
