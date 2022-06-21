const moment = require("moment");
const path = require("path");
const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();
const exclude = require("../util/functions").exclude;
const fs = require("fs");

exports.addPost = async (req, res, next) => {
    const id = req.user.id;
    let content = undefined;
    let caption = undefined;
    if (req.body.caption) caption = req.body.caption;
    if (req.body.content) content = req.body.content;
    let post_type = "TEXT";
    if (req.file) {
        post_type = req.fileType;
        content = req.file.filename;
        req.fileType = null;
    }
    if (content == undefined) {
        let message = {
            status: 401,
            error: [
                {
                    msg: "Post content not provided",
                    param: "content, file",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    let post = await prisma.post.create({
        data: {
            content,
            caption,
            user: {
                connect: {
                    id
                }
            },
            post_type
        },
        select: {
            user: {
                select: {
                    username: true,
                    email: true
                }
            }
        }
    });
    res.send(post);
};
exports.showPosts = async (req, res, next) => {
    let posts = await prisma.post.findMany({
        select: {
            _count: true,
            id: true,
            post_type: true,
            caption: true,
            content: true,
            created_at: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    profile_picture: true
                }
            },
            comments: {
                select: {
                    id: true,
                    comment_type: true,
                    content: true,
                    created_at: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            profile_picture: true
                        }
                    }
                }
            },
            likes: {
                select: {
                    id: true,
                    created_at: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            profile_picture: true
                        }
                    }
                }
            }
        }
    });
    posts = posts.map(post => {
        return {
            ...post,
            created_at: moment(post.created_at).format("DD-MM-YYYY, h:mm:ss").toString(),
            user: { ...post.user, profile_picture: path.resolve(appRoot, "..", "media", "dp", post.user.profile_picture) },
            likes: post.likes.map(like => {
                return {
                    ...like,
                    created_at: moment(like.created_at).format("DD-MM-YYYY, h:mm:ss").toString(),
                    user: { ...like.user, profile_picture: path.resolve(appRoot, "..", "media", "dp", like.user.profile_picture) },
                };
            }),
            comments:
                post.comments.map(comment => {
                    return {
                        ...comment,
                        created_at: moment(comment.created_at).format("DD-MM-YYYY, h:mm:ss").toString(),
                        user: { ...comment.user, profile_picture: path.resolve(appRoot, "..", "media", "dp", comment.user.profile_picture) },
                    };
                })

        };
    });
    res.send(posts);
};

exports.toggleLike = async (req, res, next) => {
    const post_id = req.body.post_id;
    const user_id = req.user.id;
    let liked = await prisma.post.findFirst({
        where: {
            id: post_id,
            likes: {
                some: {
                    user: {
                        id: user_id
                    }
                }
            }
        },
        select: {
            likes: {
                select: {
                    id: true,
                    user_id: true
                }
            }
        }
    });
    if (liked) {
        let like_id = liked.likes.find(like => like.user_id = req.user.id).id;
        let like = await prisma.like.delete({
            where: {
                id: like_id
            }
        });
        like.status = "UNLIKE";
        res.send(like);
        return;
    }
    let like = await prisma.like.create({
        data: {
            post: {
                connect: {
                    id: post_id
                }
            },
            user: {
                connect: {
                    id: user_id
                }
            },
        },
        select: {
            post: {
                select: {
                    id: true,
                    post_type: true,
                    caption: true,
                    content: true,
                }
            },
            user: {
                select: {
                    id: true,
                    username: true,
                    profile_picture: true,
                }
            }
        }
    });
    like.status = "LIKE";
    like.user.profile_picture = path.resolve(appRoot, "..", "media", "dp", like.user.profile_picture);
    res.send(like);
};

exports.removePost = async (req, res, next) => {
    const post_id = req.body.post_id;
    const user_id = req.user.id;
    let post = await prisma.post.findFirst({
        where: {
            id: post_id,
        }
    });
    if (!post) {
        let message = {
            status: 404,
            error: [
                {
                    msg: "Post not found",
                    param: "post_id",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    if (post.user_id != user_id) {
        let message = {
            status: 403,
            error: [
                {
                    msg: "Unauthorized",
                    param: "",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    let remove = await prisma.post.delete({
        where: {
            id: post.id
        }
    });
    if (remove.post_type == "PICTURE") fs.unlinkSync(path.resolve(appRoot, "..", "media", "posts", "pictures", remove.content));
    if (remove.post_type == "VIDEO") fs.unlinkSync(path.resolve(appRoot, "..", "media", "posts", "video", remove.content));
    res.send(remove);
};

exports.comment = async (req, res, next) => {
    const post_id = req.body.post_id;
    const user_id = req.user.id;
    let post = await prisma.post.findFirst({
        where: {
            id: post_id
        }
    });
    if (!post) {
        let message = {
            status: 404,
            error: [
                {
                    msg: "Post not found",
                    param: "post_id",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    let content = undefined;
    if (req.body.content) content = req.body.content;
    let comment_type = "TEXT";
    if (req.file) {
        comment_type = req.fileType;
        content = req.file.filename;
        req.fileType = null;
    }
    if (content == undefined) {
        let message = {
            status: 401,
            error: [
                {
                    msg: "Comment content not provided",
                    param: "content, file",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    let comment = await prisma.comment.create({
        data: {
            content,
            user: {
                connect: {
                    id: user_id
                }
            },
            comment_type,
            post: {
                connect: {
                    id: post_id
                }
            }
        },
        select: {
            id: true,
            comment_type: true,
            content: true,
            post: {
                select: {
                    id: true,
                    post_type: true,
                    content: true
                }
            },
            user: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });
    res.send(comment);
};

exports.removeComment = async (req, res, next) => {
    const comment_id = req.body.comment_id;
    const user_id = req.user.id;
    let comment = await prisma.comment.findFirst({
        where: {
            id: comment_id
        }
    });
    if (!comment) {
        let message = {
            status: 404,
            error: [
                {
                    msg: "Comment not found",
                    param: "comment_id",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    if (comment.user_id != user_id) {
        let message = {
            status: 404,
            error: [
                {
                    msg: "Unauthorized",
                    param: "",
                },
            ],
        };
        return next(new Error(JSON.stringify(message)));
    }
    let remove = await prisma.comment.delete({
        where: {
            id: comment.id
        }
    });
    if (remove.comment_type == "PICTURE") fs.unlinkSync(path.resolve(appRoot, "..", "media", "comments", "pictures", remove.content));
    if (remove.comment_type == "AUDIO") fs.unlinkSync(path.resolve(appRoot, "..", "media", "comments", "audio", remove.content));
    res.send(remove);
};