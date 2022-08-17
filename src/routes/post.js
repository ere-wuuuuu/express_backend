const router = require("express").Router();
const post = require("../controller/post");
const userAuth = require("../util/user-auth");
const uploadPost = require("../util/post_post").uploadPost;
const uploadComment = require("../util/post_comment").uploadComment;

router.post("/add", userAuth, uploadPost.single("file"), post.addPost);

router.post("/like", userAuth, post.toggleLike);

router.delete("/delete", userAuth, post.removePost);

router.post("/comment", userAuth, uploadComment.single("file"), post.comment);

router.get("/feed/:count?/:page?", userAuth, post.getFeed);

router.delete("/comment/delete", userAuth, post.removeComment);

router.get("/:post_id", userAuth, post.getPost);

module.exports = router;