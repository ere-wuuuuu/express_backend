const express = require("express");
const fs = require("fs");
var path = require("path");
const { env } = require("process");
const cors = require("cors");
//Import helper functions
const errorHandler = require("./util/error-handler");
const app = express();
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
app.use(cors());
app.use("/api/user", user);
app.use("/api/post", post);

//Error handler
app.use(errorHandler);
const PORT = process.env.PORT || 6735;
global.appUrl = "http://localhost:" + PORT;
app.listen(PORT, () => {
    console.log("Server running on port ", PORT);
});