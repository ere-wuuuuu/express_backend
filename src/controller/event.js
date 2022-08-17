const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();

exports.getAll = async (req, res, next) => {
    let events = await prisma.event.findMany({
        where: {
            user_id: req.user.id
        }
    });
    res.send(events);
};