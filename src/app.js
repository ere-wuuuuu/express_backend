const express = require("express");
const fs = require("fs");
var path = require("path");
const { env } = require("process");
const cors = require("cors");
//Import helper functions
const errorHandler = require("./util/error-handler");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*"
    }
});
global.io = io;
let users = [];
app.use(express.json());
global.appRoot = __dirname;
app.use(express.static(path.join(appRoot, "..", "media")));
require("dotenv").config();
try {
    if (!fs.existsSync(path.join(appRoot, "..", "media"))) {
        fs.mkdirSync(path.join(appRoot, "..", "media"));
    }
    if (!fs.existsSync(path.join(appRoot, "..", "media", "posts"))) {
        fs.mkdirSync(path.join(appRoot, "..", "media", "posts"));
    }
    if (!fs.existsSync(path.join(appRoot, "..", "media", "dp"))) {
        fs.mkdirSync(path.join(appRoot, "..", "media", "dp"));
    }
    if (!fs.existsSync(path.join(appRoot, "..", "media", "comments"))) {
        fs.mkdirSync(path.join(appRoot, "..", "media", "comments"));
    }
} catch (err) { }
// Routes;
const user = require("./routes/user");
const post = require("./routes/post");
const event = require("./routes/event");
app.use(cors({ origin: "*", methods: "GET, POST, PATCH", allowedHeaders: "*" }));
app.use("/api/user", user);
app.use("/api/post", post);
app.use("/api/event", event);

//Error handler
app.use(errorHandler);
const PORT = process.env.PORT || 6735;
global.appUrl = "http://localhost:" + PORT;


// WebSockets
io.on('connection', (socket) => {
    socket.on('login', (data) => {
        users = users.filter(user =>
            user.socket_id != socket.id
        );
        users = [...users, { login_id: data, socket_id: socket.id }];
        global.users = users;

    });

    //Disconnect
    socket.on('disconnect', () => {
        users = users.filter(user =>
            user.socket_id != socket.id
        );
        global.users = users;
    });
});
app.get("/user", (req, res, next) => {
    res.send(users);
});
server.listen(PORT, () => {
    console.log("Server running on port ", PORT);
});