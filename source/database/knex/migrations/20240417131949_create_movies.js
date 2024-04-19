exports.up = (knex) =>
  knex.schema.createTable("movies", (table) => {
    table.increments("id", true);
    table.integer("user_id").references("id").inTable("users").notNull().onDelete("CASCADE");
    table.string("name").notNull();
    table.string("description");
    table.integer("rating").notNull();
    table.timestamp("created_at").default(knex.fn.now()).notNull();
    table.timestamp("updated_at").default(knex.fn.now()).notNull();
  });

exports.down = (knex) => knex.schema.dropTable("movies");
