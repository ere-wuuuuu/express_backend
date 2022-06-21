const router = require("express").Router();
const user = require("../controller/user");
const validator = require("../util/validator");
const isUser = require("../util/user-auth");
const { uploadProfilePicture } = require("../util/post_profile_picture");
const userAuth = require("../util/user-auth");

router.post("/register", validator.userRegister, validator.validate, user.register)

router.post("/login", validator.userLogin, validator.validate, user.login)

router.patch("/update", isUser, uploadProfilePicture.single('picture'), validator.updateProfile, validator.validate, user.update)

router.get("/profile", isUser);

router.get("/delete", userAuth, user.sendDeleteConfirmation)

router.get("/:id", user.getUser)

module.exports = router;