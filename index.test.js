const supertest = require("supertest");
const { app } = require("./index");
const cookieSession = require("cookie-session"); // jest looks by default in dir __mocks__, i.e. the directory does not have to be further specified. Jest now looks for the mock, not for the real cookie-session

test("GET /welcome sends 200 status code as response", () => {
    // this code makes the request to our server
    return (
        supertest(app)
            .get("/welcome")
            // .then receives the response from our server
            .then((res) => {
                // "res" is the response we receive from our server, could also be called something else
                // console.log("response from server:", res);
                // 3 most commonly used properties of res are:
                // 1. statusCode
                // 2. text - shows us what HTML server sent as a response
                // 3. header(s) - shows headers that server sent as part of response
                expect(res.statusCode).toBe(200);
                expect(res.text).toBe("<h1>welcome to my website</h1>");
            })
    );
});

test("GET /home sends 302 status code as response when no cookie", () => {
    // in this test no cookies are being sent to server as part of the request!
    return supertest(app)
        .get("/home")
        .then((res) => {
            expect(res.statusCode).toBe(302);
        });
});

// GET: send cookie as part of the request
test("GET /home sends 200 status code as response when there is a 'submitted' cookie and checks the correct HTML is sent back as response", () => {
    // the first thing we'll have to do is create our 'submitted' cookie
    // we have to create a fake one with mock
    cookieSession.mockSessionOnce({
        submitted: true,
    });
    return supertest(app)
        .get("/home")
        .then((res) => {
            expect(res.statusCode).toBe(200);
            expect(res.text).toBe("<h1>home</h1>");
        });
});

// POST: confirm that cookie is successfully set
test("POST /welcome sets req.session.submitted to true", () => {
    // 1. create an empty cookie that the server will eventually write data to
    const cookie = {}; // variable, value is empty object
    cookieSession.mockSessionOnce(cookie); // establishes this variable as fake cookie

    // 2. use supertest to make request to server (as usual)
    return supertest(app)
        .post("/welcome") // post, not get!
        .then((res) => {
            console.log("cookie in my test:", cookie); // { submitted: true }
            // use toEqual for objects and arrays:
            expect(cookie).toEqual({
                submitted: true,
            });
        });
});

// run test in console with `npm test`
