const path = require("path");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const supportedFileTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/3gpp", "video/webm", "video/ogg", "video/mpeg", "video/mp4", "video/x-msvideo"];
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
        const videoTypes = ["video/3gpp", "video/webm", "video/ogg", "video/mpeg", "video/mp4", "video/x-msvideo"];
        const fileType = file.mimetype;
        let folder;
        folder = videoTypes.includes(fileType) ? "videos" : "pictures";
        req.fileType = videoTypes.includes(fileType) ? "VIDEO" : "PICTURE";
        if (!fs.existsSync(path.join(appRoot, "..", "media", "posts", folder))) {
            fs.mkdirSync(path.join(appRoot, "..", "media", "posts", folder));
        }
        cb(null, path.join(appRoot, "..", "media", "posts", folder));
    },
    filename: function (req, file, cb) {
        const { username } = req.user;
        const uniqueSuffix =
            username + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
        let ext =
            file.originalname.split(".")[file.originalname.split(".").length - 1];
        cb(null, `${uniqueSuffix}.${ext}`);
    },
});
exports.uploadPost = multer({
    storage: storage,
    fileFilter: pictureFilter,
});