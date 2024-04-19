require("express-async-errors");

const express = require("express");
const AppError = require("./utils/AppError");
const database = require("./database/sqlite");
const routes = require("./router");

database();

const PORT = 3002;

const app = express();

app.use(express.json());
app.use(routes);

app.use((error, request, response, next) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: "Error",
      message: error.message,
    });
  }

  console.error(error);

  response.status(500).json({
    error: "Error",
    message: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
