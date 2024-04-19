const { use } = require("express/lib/router");
const knex = require("../database/knex");
const AppError = require("../utils/AppError");

const maxRating = 5;
const minRating = 0;

class MoviesControllers {
  async index(request, response) {
    const { user_id, title, tags } = request.query;
    let movies;

    if (tags) {
      const separatedTags = tags.split(",").map((abc) => abc.trim());
      console.log(separatedTags);

      movies = await knex("tags")
        .select(["tags.id AS tag_id", "tags.name AS tag_name", "movies.name AS movie_name", "movies.id AS movie_id", "movies.user_id"])
        .where("tags.user_id", user_id)
        .whereLike("movies.name", `%${title}%`)
        .whereIn("tags.name", separatedTags)
        .innerJoin("movies", "movies.id", "tags.movie_id")
        .orderBy("movies.name");

      // console.log(movies);
      return response.json(movies);
    }
  }

  async create(request, response) {
    const { user_id } = request.params;
    const { name, description, rating, tags } = request.body;

    // Busca no banco de dados um filme que tenha o mesmo nome do filme passado na requisição
    const existentMovieWithThisName = await knex("movies").first().where({ name });

    // Verifica se já existe um filme cadastrado com o mesmo nome, se sim, retorna um erro
    if (existentMovieWithThisName) {
      throw new AppError("Você já possui um filme cadastrado com este nome! Tente outro nome ou atualize as informações do cadastro já existente!");
    }

    // Verifica se a nota informada pelo usuário é menor que 0 ou maior que 5, se sim, retorna um erro
    if (rating < minRating || rating > maxRating) {
      throw new AppError("Você deve escolher uma nota entre 0 e 5 para este filme. Por favor, digite um número válido!");
    }

    // Adiciona ao banco o filme e armazena na variável thisMovieId o ID gerado no banco para este registro
    const [thisMovieId] = await knex("movies").insert({ user_id, name, description, rating });

    // Separa as tags recebidas através de uma string e as coloca em um array
    const separatedTags = tags.split("-");

    // Percorre o array de tags e executa o código para cada uma delas inserindo-as no banco de dados
    separatedTags.map(async (tag) => {
      // Verifica se a tag possui um nome válido, se não, retorna um erro
      if (!tag || tag == " ") {
        throw new AppError("Você deve passar um nome válido de tag");
      }

      // Insere a tag no banco de dados
      await knex("tags").insert({ movie_id: thisMovieId, user_id, name: String(tag).toUpperCase() });
    });

    // Retorna um JSON vazio
    return response.status(200).json();
  }
}

module.exports = MoviesControllers;
