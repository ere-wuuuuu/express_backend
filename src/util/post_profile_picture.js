const path = require("path");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const pictureFilter = (req, file, cb) => {
    let fileType = file.mimetype;
    if (fileType === "image/jpeg" || "image/png" || "image/webp" || "image/gif") {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file format"), false);
    }
};
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(path.join(appRoot, "..", "media", "dp"))) {
            fs.mkdirSync(path.join(appRoot, "..", "media", "dp"));
        }
        cb(null, path.join(appRoot, "..", "media", "dp"));
    },
    filename: function (req, file, cb) {
        const { username } = req.user;
        const uniqueSuffix =
            Date.now() + "_$_" + username + "_$_" + Math.round(Math.random() * 1e9);
        let ext =
            file.originalname.split(".")[file.originalname.split(".").length - 1];
        cb(null, `${uniqueSuffix}.${ext}`);
    },
});
exports.uploadProfilePicture = multer({
    storage: storage,
    fileFilter: pictureFilter,
});