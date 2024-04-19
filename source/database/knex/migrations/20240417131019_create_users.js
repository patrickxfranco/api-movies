exports.up = (knex) =>
  knex.schema.createTable("users", (table) => {
    table.increments("id", true);
    table.string("name").notNull();
    table.string("email").notNull();
    table.string("password").notNull();
    table.string("avatar");
    table.timestamp("created_at").default(knex.fn.now()).notNull();
    table.timestamp("updated_at").default(knex.fn.now()).notNull();
  });

exports.down = (knex) => knex.schema.dropTable("users");
