const { Router } = require("express");

const usersRouter = require("./users.routes");
const disheRouter = require("./dishes.routes");
const tagsRouter = require("./tags.routes");
const sessionsRouter = require("./sessions.routes");

const routes = Router();

routes.use("/users", usersRouter);
routes.use("/dishes", disheRouter);
routes.use("/tags", tagsRouter);
routes.use("/sessions", sessionsRouter);

module.exports = routes;
