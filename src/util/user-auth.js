const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

module.exports = async function (req, res, next) {
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader != "undefined") {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        jwt.verify(
            bearerToken,
            process.env.TOKEN_KEY,
            async (err, authData) => {
                if (err) {
                    res.status(403).send(err);
                } else {
                    let user = await prisma.user.findUnique({
                        where: {
                            id: authData._id,
                        },
                    });
                    if (user) {
                        req.user = user;
                        next();
                    } else {
                        res
                            .status(403)
                            .send({ status: 403, error: [{ msg: "Unauthorized" }] });
                    }
                }
            }
        );
    } else {
        res
            .status(401)
            .send({ status: 401, errors: [{ message: "Unauthorized" }] });
    }
};