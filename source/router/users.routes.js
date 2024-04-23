const { Router } = require("express");

const UserControllers = require("../controller/users.controllers");

const userRoutes = Router();

const userControllers = new UserControllers();

userRoutes.post("/create", userControllers.create);
userRoutes.put("/update/:user_id", userControllers.update);
userRoutes.delete("/delete/:user_id", userControllers.delete);

module.exports = userRoutes;
