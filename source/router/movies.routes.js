const { Router } = require("express");

const MoviesControllers = require("../controller/movies.controllers");

const moviesRoutes = Router();

const moviesControllers = new MoviesControllers();

moviesRoutes.get("/", moviesControllers.index);
moviesRoutes.post("/create/:user_id", moviesControllers.create);

module.exports = moviesRoutes;
