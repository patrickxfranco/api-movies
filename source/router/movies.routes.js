const { Router } = require("express");

const MoviesControllers = require("../controller/movies.controllers");

const moviesRoutes = Router();

const moviesControllers = new MoviesControllers();

moviesRoutes.get("/movies/:user_id", moviesControllers.index);
moviesRoutes.post("/create/:user_id", moviesControllers.create);
moviesRoutes.get("/:movie_id", moviesControllers.show);
moviesRoutes.put("/:movie_id", moviesControllers.update);
moviesRoutes.delete("/:movie_id", moviesControllers.delete);

module.exports = moviesRoutes;
