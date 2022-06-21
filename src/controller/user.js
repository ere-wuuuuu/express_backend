const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const exclude = require("../util/functions").exclude;
const sendMail = require("../util/transporter");
exports.register = async (req, res, next) => {
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const birth_date = req.body.birth_date;
    const username = req.body.username;
    const password = req.body.password;
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    const user = await prisma.user.create({
        data: {
            first_name,
            last_name,
            email,
            birth_date: new Date(birth_date),
            username,
            password: hash
        }
    });
    const token = jwt.sign(
        {
            _id: user.id,
            name: user.username,
        },
        process.env.TOKEN_KEY,
        {
            expiresIn: "3d",
        }
    );
    let return_json = {
        id: user.id,
        username: user.username,
        token,
        expiration_date: Date.now() + (3 * 24 * 60 * 60 * 1000),
    };
    res.status(201).send(return_json);
};

exports.login = async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = await prisma.user.findFirst({
        where: {
            username,
        }
    });
    if (!user) {
        let message = {
            status: 404,
            error: [
                {
                    msg: "Incorrect username or password",
                    param: "username, password",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
        let message = {
            status: 400,
            error: [
                {
                    msg: "Incorrect username or password",
                    param: "username, password",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    const token = jwt.sign(
        {
            _id: user.id,
            name: user.username,
        },
        process.env.TOKEN_KEY,
        {
            expiresIn: "3d",
        }
    );
    let return_json = {
        id: user.id,
        username: user.username,
        token,
        expiration_date: Date.now() + (3 * 24 * 60 * 60 * 1000),
    };
    res.status(201).send(return_json);
};

exports.update = async (req, res, next) => {
    let profile_picture = undefined;
    let username = undefined;
    let bio = undefined;
    let id = req.user.id;
    if (req.body.username) username = req.body.username;
    if (req.body.bio) bio = req.body.bio;
    if (req.file) {
        let directory = fs.readdirSync(path.join(appRoot, "..", "media", "dp"));
        let userPictures = directory
            .filter(file => file.includes(`_$_${req.user.username}_$_`))
            .map(file => path.resolve(appRoot, "..", "media", "dp", file));
        userPictures.forEach(picture => {
            if (picture != req.file.path) {
                fs.unlinkSync(picture);
            }
        });
        profile_picture = req.file.filename;
    }
    let user = await prisma.user.update({
        where: {
            id
        },
        data: {
            profile_picture,
            username,
            bio
        }
    });
    res.send(exclude(user, "password"));
};

exports.getUser = async (req, res, next) => {
    const id = req.params.id;
    let user;
    console.log(req.user);
    if (!req.user) {
        user = await prisma.user.findUnique({
            where: {
                id
            }
        });
    } else {
        user = await prisma.user.findUnique({
            where: {
                id
            },
            include: {
                posts: {
                    include: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });
    }

    if (!user) {
        let message = {
            status: 404,
            error: [
                {
                    msg: "User not found",
                    param: "id",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    res.status(200).send(exclude(user, "password", "bio", "created_at"));
};

exports.sendDeleteConfirmation = async (req, res, next) => {
    const id = req.user.id;
    let user = await prisma.user.findUnique({
        where: {
            id
        }
    });
    if (!user) {
        let message = {
            status: 404,
            error: [
                {
                    msg: "User not found",
                    param: "id",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    let otp = Math.round(Math.random() * 1e9).toString().slice(0, 5);
    let confirmation = prisma.confirmation.create({
        data: {
            user_id: id,
            type: "DELETE",
            key: otp
        }
    });
    let response = sendMail(process.env.SYSTEM_EMAIL, user.email, "Deleting your account", otp);
    res.send(response);
};