const router = require("express").Router();
const controller = require("../controller/user");
const validator = require("../util/validator");
const isUser = require("../util/user-auth");
const { uploadProfilePicture } = require("../util/post_profile_picture");

router.post("/register", validator.userRegister, validator.validate, controller.register);

router.post("/login", validator.userLogin, validator.validate, controller.login);

router.patch("/update", isUser, uploadProfilePicture.single('picture'), validator.updateProfile, validator.validate, controller.update);

router.get("/profile/", isUser, controller.getProfile);

router.get("/delete", isUser, controller.sendDeleteConfirmation);

router.post("/follow", isUser, controller.toggleFollow);

router.get("/all/:count?/:page?", controller.getAll);

router.get("/:id", controller.getUser);


module.exports = router;