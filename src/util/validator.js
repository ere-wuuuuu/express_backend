const { check, body, validationResult } = require("express-validator");
const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send({ error: errors.array() });
    return next();
};

// Request Validation
exports.userRegister = [
    body("first_name")
        .trim()
        .exists({ checkFalsy: true })
        .withMessage("First name not provided")
        .bail()
        .customSanitizer(value => {
            return value.replace(/\s+/g, '').toLowerCase();
        }),
    body("last_name")
        .trim()
        .exists({ checkFalsy: true })
        .withMessage("Last name not provided")
        .bail()
        .customSanitizer(value => {
            return value.replace(/\s+/g, '').toLowerCase();
        }),
    body("email")
        .exists({ checkFalsy: true })
        .withMessage("Email not provided")
        .bail()
        .isEmail()
        .withMessage("Provided email not valid")
        .bail()
        .custom(value => {
            return prisma.user.findFirst({
                where: {
                    email: value
                }
            }).then(user => {
                if (user) {
                    return Promise.reject('Email already in use');
                }
            })
        })
        .bail()
        .normalizeEmail(),
    body("birth_date")
        .exists({ checkFalsy: true })
        .withMessage("Birth date not provided")
        .bail()
        .isDate({ format: "yyyy-mm-dd" })
        .withMessage("Not a valid date (yyyy-mm-dd)"),
    body("username")
        .exists({ checkFalsy: true })
        .withMessage("Username not provided")
        .bail()
        .isAlphanumeric()
        .withMessage("Only letters and numbers are allowed in username")
        .bail()
        .custom(value => {
            return prisma.user.findFirst({
                where: {
                    username: value
                }
            }).then(user => {
                if (user) {
                    return Promise.reject('Username already in use');
                }
            })
        }),
    body('password')
        .exists({ checkFalsy: true })
        .withMessage("Password not provided")
        .bail()
        .isLength({ min: 6 })
        .withMessage("Password should be at least 6 characters long"),
    body('confirm_password')
        .exists({ checkFalsy: true })
        .withMessage("Password confirmation not provided")
        .bail()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        })
]
exports.userLogin = [
    body("username")
        .exists({ checkFalsy: true })
        .withMessage("Username not provided"),
    body("password")
        .exists({ checkFalsy: true })
        .withMessage("Password not provided")
]
exports.updateProfile = [
    body('username')
        .optional({ nullable: true })
        .custom(value => {
            return prisma.user.findFirst({
                where: {
                    username: value
                }
            }).then(user => {
                if (user) {
                    return Promise.reject('Username already in use');
                }
            })
        })
        .bail(),
    body('bio')
        .optional({ nullable: true })
        .isLength({ max: 128 })
        .withMessage("Bio can not be more than 128 characters")
]