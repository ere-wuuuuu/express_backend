const path = require("path");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const supportedFileTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "audio/mpeg", "audio/aac", "audio/ogg", "audio/wav"];
const pictureFilter = (req, file, cb) => {
    let fileType = file.mimetype;
    if (supportedFileTypes.includes(fileType)) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file format"), false);
    }
};
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const audioTypes = ["audio/mpeg", "audio/aac", "audio/ogg", "audio/wav"];
        const fileType = file.mimetype;
        let folder;
        folder = audioTypes.includes(fileType) ? "audio" : "pictures";
        req.fileType = audioTypes.includes(fileType) ? "AUDIO" : "PICTURE";
        if (!fs.existsSync(path.join(appRoot, "..", "media", "comments", folder))) {
            fs.mkdirSync(path.join(appRoot, "..", "media", "comments", folder));
        }
        cb(null, path.join(appRoot, "..", "media", "comments", folder));
    },
    filename: function (req, file, cb) {
        const { username } = req.user;
        const uniqueSuffix =
            username + "-comment-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
        let ext =
            file.originalname.split(".")[file.originalname.split(".").length - 1];
        cb(null, `${uniqueSuffix}.${ext}`);
    },
});
exports.uploadComment = multer({
    storage: storage,
    fileFilter: pictureFilter,
});