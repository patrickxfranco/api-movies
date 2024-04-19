const knex = require("../database/knex");

class TagsController {
  async index(request, response) {
    const { user_id } = request.params;

    // Busca no banco todas as tags pertencentes ao usuário informado na requisição e retorna um array de objetos com as tags
    const userTags = await knex("tags").where({ user_id });
    return response.status(200).json(userTags);
  }
}

module.exports = TagsController;
