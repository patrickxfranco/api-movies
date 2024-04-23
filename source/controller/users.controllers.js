const knex = require("../database/knex");
const AppError = require("../utils/AppError");
const { hash, compare } = require("bcrypt");

const minCharactersInPassword = 6;

class UserControllers {
  async create(request, response) {
    const { name, email, password, avatar } = request.body;

    // Busca no banco de dados um usuário que já possui uma conta com o email informado cadastrado
    const userWithThisExistentEmail = await knex("users").first().where({ email });

    // Verifica retornou algo da busca do banco, se sim, retorna um erro
    if (userWithThisExistentEmail) {
      throw new AppError("Já existe um usuário com este endereço de email");
    }

    // Verifica se a senha informada possui pelo menos 6 caracteres
    if (password.length < minCharactersInPassword) {
      throw new AppError(`A senha informada é inválida, digite uma senha que possua pelo menos ${minCharactersInPassword} caracteres`);
    }

    const hashedPassword = await hash(password, 8);

    // Insere os dados no banco de dados e retorna um JSON vazio
    await knex("users").insert({ name, email, password: hashedPassword, avatar });
    return response.status(201).json();
  }

  async update(request, response) {
    const { user_id } = request.params;

    const { oldPassword } = request.body;
    let { name, email, password, avatar } = request.body;

    // Busca no banco de dados as informações atuais do usuário informado na requisição
    const currentUserData = await knex("users").first().where({ user_id });

    // Verifica se o usuário informou um email
    if (email) {
      // Busca no banco de dados um usuário que possua o mesmo email que foi informado na requisição
      const userWithThisExistentEmail = await knex("users").first().where({ email });

      // Retorna uma mensagem de erro se o email já estiver sendo usado por outra pessoa
      if (userWithThisExistentEmail) {
        throw new AppError("Já existe um usuário com este endereço de email cadastrado");
      }
    }

    // Verifica se o usuário informou uma senha
    if (password) {
      // Verifica se a nova senha possui ao menos 6 caracteres
      if (password.length < minCharactersInPassword) {
        throw new AppError(`A senha informada é inválida, digite uma senha que possua pelo menos ${minCharactersInPassword} caracteres`);
      }

      // Se informar uma nova senha e não informar a senha antiga, retorna erro
      if (password && !oldPassword) {
        throw new AppError("Você precisa informar sua senha antiga para alterar sua senha atual");
      }

      // Compara se a senha antiga informada é igual a senha atual do banco de dados
      const checkOldPassword = await compare(oldPassword, currentUserData.password);

      // Se a senha for diferente uma da outra, retorna um erro.
      if (!checkOldPassword) {
        throw new AppError("A senha antiga não coincide. Digite a senha antiga corretamente para continuar", 401);
      }

      // Transforma a senha em hash
      password = await hash(password, 8);
    }

    // Insere as novas informações no banco de dados e retorna uma resposta com um JSON vazio
    await knex("users").update({
      name: name ?? currentUserData,
      email: email ?? currentUserData.email,
      password: password ?? currentUserData.password,
      avatar: avatar ?? currentUserData.avatar,
      updated_at: knex.fn.now(),
    });
    return response.status(200).json();
  }

  async delete(request, response) {
    const { user_id } = request.params;

    // Busca um usuário no banco de dados com o ID informado
    const userWithThisId = await knex("users").first().where({ user_id });

    // Verifica se não existe um usuário no banco com o ID informad
    if (!userWithThisId) {
      throw new AppError(`Não existe nenhum usuário com o ID(${user_id}) informado`);
    }

    // Remove o usuário do banco de dados e retorna um JSON vazio
    await knex("users").delete().where({ user_id });
    return response.status(200).json();
  }
}

module.exports = UserControllers;
