const { Router } = require("express");

const userRoutes = require("./users.routes");
const movieRoutes = require("./movies.routes");
const tagRoutes = require("./tags.routes");

const routes = Router();

routes.use("/user", userRoutes);
routes.use("/movie", movieRoutes);
routes.use("/tag", tagRoutes);

module.exports = routes;
