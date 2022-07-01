const router = require("express").Router();
const user = require("../controller/user");
const validator = require("../util/validator");
const isUser = require("../util/user-auth");
const { uploadProfilePicture } = require("../util/post_profile_picture");

router.post("/register", validator.userRegister, validator.validate, user.register);

router.post("/login", validator.userLogin, validator.validate, user.login);

router.patch("/update", isUser, uploadProfilePicture.single('picture'), validator.updateProfile, validator.validate, user.update);

router.get("/profile/:post_count?/:post_page?", isUser, user.getProfile);

router.get("/delete", isUser, user.sendDeleteConfirmation);

router.post("/follow", isUser, user.toggleFollow);

router.get("/all/:count?/:page?", user.getAll);

router.get("/:id", user.getUser);

module.exports = router;