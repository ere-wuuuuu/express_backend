const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
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
                        likes: {
                            take: 6,
                        },
                        comments: {
                            take: 6
                        }
                    },
                    take: 6
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
    user.profile_picture = `${appUrl}/dp/${user.profile_picture}`;
    if (user.posts) {
        user.posts = user.posts.map(post => {
            if (post.post_type == "VIDEO") return post.content = `${appUrl}/posts/videos/${post.content}`;
            if (post.post_type == "PICTURE") return post.content = `${appUrl}/posts/pictures/${post.content}`;
        });
    }
    res.status(200).send(exclude(user, "password", "created_at"));
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

exports.getProfile = async (req, res, next) => {
    const id = req.user.id;
    if (req.params.post_count && +req.params.post_count > 15) {
        let message = {
            status: 400,
            error: [
                {
                    msg: "Number of post per page can not exceed 14",
                    param: "post_count",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    const post_count = req.params.post_count ? +req.params.post_count : 1;
    const post_page = req.params.post_page ? +req.params.post_page : 1;
    let user = await prisma.user.findUnique({
        where: {
            id
        },
        include: {
            posts: {
                include: {
                    likes: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                }
                            }
                        },
                        take: 2
                    },
                    comments: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                }
                            }
                        },
                        take: 2
                    },
                    _count: true
                },
                take: post_count,
                skip: post_count * (post_page - 1)

            },
            followers: {
                include: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        }
                    }
                }
            },
            following: {
                include: {
                    following: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        }
                    }
                }
            },
            _count: {
                select: {
                    posts: true,

                }
            }
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
    user.profile_picture = `${appUrl}/dp/${user.profile_picture}`;
    user.posts = user.posts.map(post => {
        return {
            ...post,
            created_at: moment(post.created_at).format("DD-MM-YYYY, h:mm:ss").toString(),
            content: (post.post_type == "VIDEO") ? `${appUrl}/posts/videos/${post.content}` : (post.post_type == "PICTURE") ? `${appUrl}/posts/pictures/${post.content}` : post.content,
            likes: post.likes.map(like => {
                return {
                    ...like,
                    created_at: moment(like.created_at).format("DD-MM-YYYY, h:mm:ss").toString(),
                };
            }),
            comments: post.comments.map(comment => {
                return {
                    ...comment,
                    created_at: moment(comment.created_at).format("DD-MM-YYYY, h:mm:ss").toString(),
                    content: (comment.comment_type == "AUDIO") ? `${appUrl}/comments/audio/${comment.content}` : (comment.comment_type == "PICTURE") ? `${appUrl}/comments/pictures/${comment.content}` : comment.content,
                };
            })
        };
    });
    user.posts.forEach(post => {
        exclude(post, "user_id");
        post.likes.forEach(like => {
            exclude(like, "user_id", "post_id");
        });
        post.comments.forEach(comment => {
            exclude(comment, "user_id", "post_id");
        });
    });
    res.status(200).send(exclude(user, "password", "created_at"));
};

exports.toggleFollow = async (req, res, next) => {
    const user_id = req.user.id;
    const follow_id = req.body.follow_id;
    let following = await prisma.follow.findFirst({
        where: {
            follower_id: user_id,
            following_id: follow_id
        }
    });
    if (following) {
        let unFollow = await prisma.follow.delete({
            where: {
                id: following.id
            }
        });
        unFollow.status = "UNFOLLOW";
        return res.send(unFollow);
    }
    let follow = await prisma.follow.create({
        data: {
            follower_id: user_id,
            following_id: follow_id
        }
    });
    follow.status = "FOLLOW";
    res.send(follow);
};

exports.getAll = async (req, res, next) => {
    const count = req.params.count ? +req.params.count : 5;
    const page = req.params.page ? +req.params.page : 1;
    let user_count = await prisma.user.count();
    let users = await prisma.user.findMany({
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            username: true,
            _count: {
                select: {
                    followers: true,
                    following: true,
                    posts: true
                }
            }
        },
        take: count,
        skip: count * (page - 1)
    });
    let data = {
        users,
        _count: {
            users: user_count,
            pages: Math.ceil(user_count / count)
        }
    };
    res.send(data);
};
