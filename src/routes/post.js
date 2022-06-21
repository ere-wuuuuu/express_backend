const router = require("express").Router();
const post = require("../controller/post");
const userAuth = require("../util/user-auth");
const uploadPost = require("../util/post_post").uploadPost;
const uploadComment = require("../util/post_comment").uploadComment;

router.post("/add", userAuth, uploadPost.single("file"), post.addPost);
router.get("", userAuth, post.showPosts);
router.post("/like", userAuth, post.toggleLike);
router.delete("/delete", userAuth, post.removePost);
router.post("/comment", userAuth, uploadComment.single("file"), post.comment);
router.delete("/comment/delete", userAuth, post.removeComment);

module.exports = router;