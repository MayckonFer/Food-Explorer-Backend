const knex = require("../database/knex");
const sqliteConnection = require("../database/sqlite");
const DiskStorage = require("../providers/DiskStorage");
const AppError = require("../utils/AppError");

class DishesController {
  async create(request, response) {
    const { title, description, price, category, tags } = request.body;
    const user_id = request.user.id;
    const avatarFileName = request.file.filename;

    const tagsArray = tags.split(",");

    const diskStorage = new DiskStorage();
    const filename = await diskStorage.saveFile(avatarFileName);

    const [dishes_id] = await knex("dishes").insert({
      title,
      description,
      price,
      category,
      avatar: filename,
      user_id,
    });

    const tagsInsert = tagsArray.map((name) => {
      return {
        dishes_id,
        name,
        user_id,
      };
    });

    await knex("tags").insert(tagsInsert);

    return response.json({ message: "Prato criado com sucesso" });
  }

  async update(request, response) {
    const { title, description, price, avatar } = request.body;
    const { id } = request.params;

    const database = await sqliteConnection();
    const existingDish = await database.get(
      "SELECT * FROM dishes WHERE id = ?",
      [id]
    );

    if (!existingDish) {
      throw new AppError("Prato não encontrado");
    }

    async function checkAndUpdate(field, value, errorMessage) {
      const existingDishWithField = await database.get(
        `SELECT * FROM dishes WHERE ${field} = ? AND id != ?`,
        [value, id]
      );
      if (existingDishWithField) {
        throw new AppError(errorMessage);
      }
      return value;
    }

    const updatedTitle = await checkAndUpdate(
      "title",
      title ?? existingDish.title,
      "Este título já está em uso."
    );
    const updatedDescription = await checkAndUpdate(
      "description",
      description ?? existingDish.description,
      "Esta descrição já está em uso."
    );
    const updatedPrice = await checkAndUpdate(
      "price",
      price ?? existingDish.price,
      "Este preço já está em uso."
    );
    const updatedAvatar = await checkAndUpdate(
      "avatar",
      avatar ?? existingDish.avatar,
      "Este avatar já está em uso."
    );

    await database.run(
      `
      UPDATE dishes SET 
      title = ?, 
      description = ?, 
      price = ?, 
      avatar = ?, 
      updated_at = DATETIME('now')
      WHERE id = ?
    `,
      [updatedTitle, updatedDescription, updatedPrice, updatedAvatar, id]
    );

    return response.json();
  }

  async show(request, response) {
    const { id } = request.params;

    const dishe = await knex("dishes").where({ id }).first();
    const tags = await knex("tags").where({ dishes_id: id }).orderBy("name");

    return response.json({
      ...dishe,
      tags,
    });
  }

  async delete(request, response) {
    const { id } = request.params;

    await knex("dishes").where({ id }).delete();

    return response.json();
  }

  async index(request, response) {
    const { tags } = request.query;

    const user_id = request.user.id;

    let dishes;

    if (tags) {
      const filterTags = tags.split(",").map((tag) => tag.trim());
      dishes = await await knex("tags")
        .whereIn("name", filterTags)
        .select(["dishes.id", "dishes.title", "dishes.user_id"])
        .where("dishes.user_id", user_id)
        .whereLike("dishes.title", `%${title}%`)
        .whereIn("name", filterTags)
        .innerJoin("dishes", "dishes.id", "tags.dishes_id")
        .orderBy("dishes.title");
    } else {
      dishes = await knex("dishes").where({ user_id }).orderBy("title");
    }

    const userTags = await knex("tags").where({ user_id });
    const notesWithTags = dishes.map((dish) => {
      const dishTags = userTags.filter((tag) => tag.dishes_id === dish.id);
      return {
        ...dish,
        tags: dishTags,
      };
    });
    return response.json(notesWithTags);
  }
}

module.exports = DishesController;
