exports.up = (knex) =>
  knex.schema.createTable("tags", (table) => {
    table.increments("id", true).notNull();
    table.integer("movie_id").references("id").inTable("movies").notNull().onDelete("CASCADE");
    table.integer("user_id").references("id").inTable("users").notNull().onDelete("CASCADE");
    table.string("name").notNull();
  });

exports.down = (knex) => knex.schema.dropTable("tags");
