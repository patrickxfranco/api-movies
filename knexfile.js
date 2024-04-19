const path = require("path");

module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: path.resolve(__dirname, "source", "database", "database.db"),
    },
    migrations: {
      directory: path.resolve(__dirname, "source", "database", "knex", "migrations"),
    },
    useNullAsDefault: true,
  },
};
