const knex = require("../database/knex");
const AppError = require("../utils/AppError");

const maxRating = 5;
const minRating = 0;

class MoviesControllers {
  async index(request, response) {
    const { user_id } = request.params;
    const { name, tags } = request.query;

    let movies, userTags;

    // Verifica se o usuário informou alguma tag, se sim, utiliza as tags para filtrar
    if (tags) {
      const separatedTags = tags.split("-").map((tag) => tag.trim().toLocaleLowerCase());
      movies = await knex("movies")
        .select("movies.*")
        .where("movies.user_id", user_id)
        .whereIn("tags.name", separatedTags)
        .whereLike("movies.name", `%${name}%`)
        .innerJoin("tags", "tags.movie_id", "movies.id")
        .orderBy("movies.name");
    } else {
      movies = await knex("movies")
        .select("movies.*")
        .where("movies.user_id", user_id)
        .whereLike("movies.name", `%${name}%`)
        .orderBy("movies.name");
    }

    // Busca no banco de dados as tags do usuário
    userTags = await knex("tags").where("tags.user_id", user_id);

    // Cria um objeto do tipo Set para impedir que seja adicionado filmes duplicados na resposta
    const uniqueMovieIds = new Set();
    const moviesWithTags = movies
      .map((movie) => {
        // Verifica se o filme já foi adicionado
        if (!uniqueMovieIds.has(movie.id)) {
          uniqueMovieIds.add(movie.id);

          const movieTags = userTags.filter((tag) => {
            return tag.movie_id === movie.id;
          });

          return {
            ...movie,
            tags: movieTags,
          };
        }
        return null; // Retorna null para filmes duplicados
      })
      .filter(Boolean);

    return response.status(200).json(moviesWithTags);
  }

  async create(request, response) {
    const { user_id } = request.params;
    const { name, description, rating, tags } = request.body;

    // Busca no banco de dados um filme que tenha o mesmo nome do filme passado na requisição
    const existentMovieWithThisName = await knex("movies").first().where({ name });

    // Verifica se já existe um filme cadastrado com o mesmo nome, se sim, retorna um erro
    if (existentMovieWithThisName) {
      throw new AppError(
        "Você já possui um filme cadastrado com este nome! Tente outro nome ou atualize as informações do cadastro já existente!"
      );
    }

    // Verifica se a nota informada pelo usuário é menor que 0 ou maior que 5, se sim, retorna um erro
    if (rating < minRating || rating > maxRating) {
      throw new AppError(
        "Você deve escolher uma nota entre 0 e 5 para este filme. Por favor, digite um número válido!"
      );
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
      await knex("tags").insert({ movie_id: thisMovieId, user_id, name: String(tag).toLocaleLowerCase() });
    });

    // Retorna um JSON vazio
    return response.status(200).json();
  }

  async show(request, response) {
    const { movie_id } = request.params;
    const { user_id } = request.body;

    // Busca no banco o filme com o ID especificado na requisição
    const movie = await knex("movies").select("movies.*").where("movies.user_id", user_id).where("movies.id", movie_id);

    // Busca no banco as tags relacionadas ao ID do filme especificado na requisição
    const movieTags = await knex("tags").where("tags.user_id", user_id).where("tags.movie_id", movie_id);

    // Acessa o objeto retornado do banco e adiciona as tags relacionadas, retornado um único array com todas as informações
    const movieWithTags = movie.map((movie) => {
      return {
        ...movie,
        tags: movieTags,
      };
    });

    // Envia para o usuário as informações do filme e as tags relacionadas
    return response.status(200).json(movieWithTags);
  }

  async update(request, response) {
    const { movie_id } = request.params;
    let { newName, newDescription, newRating, newTags } = request.body;

    // Busca no banco de dados os valores atuais do filme
    const currentMovieData = await knex.table("movies").first().where("id", movie_id);

    // Verifica se retornou algo na busca anterior, se não, retorna um erro ao cliente
    if (!currentMovieData) {
      throw new AppError("Não existe nenhum filme com este ID cadastrado.", 404);
    }

    if (newName) {
      // Busca no banco de dados um filme com o nome que foi informado na requisição
      const existentMovieWithThisName = await knex.table("movies").first().where("name", newName);

      // Verifica se a busca no banco de dados retornou algum filme, se sim, retorna um erro para o cliente
      if (existentMovieWithThisName) {
        throw new AppError("Já existe um filme com este nome. Por favor, escolha outro nome!");
      }
    } else {
      // Atribui a newName o antigo nome já armazenado no banco de dados se não vier nada na requisição
      newName = newName ?? currentMovieData.name;
    }

    // Se o usuário informou uma nova descrição, usará a mesma para enviar ao banco, se não, manterá a descrição que já no banco
    newDescription = newDescription ?? currentMovieData.description;

    // Verifica se o usuário passou uma nova nota para o filme
    if (newRating) {
      // Se a nota é menor que 0 ou maior que 5
      if (newRating < minRating || newRating > maxRating) {
        // Se a nota for menor que 0 e maior que 5 retorna um erro
        throw new AppError(
          `Você deve escolher uma nota válida para o filme. Por favor, digite um valor entre ${minRating} e ${maxRating}`
        );
      }
    } else {
      // Se a nota não for válida, armazena na variável newRating o antigo valor que já está no banco de dados
      newRating = newRating ?? currentMovieData.rating;
    }

    let separedTags;
    // Verifica se o usuário informou alguma tag
    if (newTags) {
      // Separa as tags recebidas em uma string em um novo array
      separedTags = newTags.split("-").map((tag) => tag.trim().toLocaleLowerCase());

      // Deleta as tags vinculadas ao filme em questão
      await knex.table("tags").delete().where("movie_id", movie_id);
    }

    // Adiciona as novas informações do filme no banco de dados
    await knex
      .table("movies")
      .update({
        name: newName,
        description: newDescription,
        rating: newRating,
      })
      .where("id", movie_id);

    // Percorre o array de tags
    separedTags.map(async (tag) => {
      // Adiciona as novas informações das tags no banco de dados
      await knex.table("tags").insert({
        movie_id: currentMovieData.id,
        user_id: currentMovieData.user_id,
        name: tag,
      });
    });

    // Retorna um array vazio com um statusCode de 200 para o cliente
    return response.status(200).json();
  }

  async delete(request, response) {
    const { movie_id } = request.params;

    const movieData = await knex.table("movies").where({ id: movie_id });

    if (!movieData) {
      throw new AppError(
        `Não foi possível encontrar um filme com o ID(${movie_id}) informado, por favor, informe um ID válido para realizar a operação`
      );
    }

    await knex.table("movies").delete().where({ id: movie_id });

    return response.status(204).json();
  }
}

module.exports = MoviesControllers;
