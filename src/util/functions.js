const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();
exports.exclude = (query, ...keys) => {
    for (let key of keys) {
        delete query[key];
    }
    return query;
};
exports.makeLink = (socket_data) => {
    if (socket_data.status == "FOLLOW" || socket_data.status == "UNFOLLOW") {
        return `user/${socket_data.action_by}`;
    }
    if (socket_data.status == "COMMENT" || socket_data.status == "LIKE") {
        return `user/${socket_data.action_on}`;
    }
    return "";
};
exports.sendNotification = async (socket_data, filter) => {
    let socket_ids = [];
    let event = await prisma.event.findFirst({
        where: {
            message: socket_data.message,
            user_id: filter
        }
    });
    if (event) {
        await prisma.event.delete({
            where: {
                id: event.id
            }
        });
    }
    let notification = await prisma.event.create({
        data: {
            message: socket_data.message,
            link: this.makeLink(socket_data),
            user_id: filter
        }
    });
    users.forEach(active_user => {
        if (active_user.login_id == filter) {
            socket_ids = [...socket_ids, active_user.socket_id];
        }
    });
    socket_ids.forEach(socket_id => {
        io.to(socket_id).emit("follow", socket_data);
    });
    return notification;
};