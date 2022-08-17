const controller = require("../controller/event");
const isUser = require("../util/user-auth");

const router = require("express").Router();

router.get("/all", isUser, controller.getAll);

module.exports = router;