const knex = require("../database/knex");
const AppError = require("../utils/AppError");
const DiskStorage = require("../providers/DiskStorage");

class DishesAvatarController {
  async update(request, response) {
    const user_id = request.user.id;
    const avatarFileName = request.file.filename;

    const diskStorage = new DiskStorage();

    const dishes = await knex("dishes").where({ user_id: user_id }).first();

    if (!dishes) {
      throw new AppError("Prato não encontrado", 404);
    }

    if (dishes.avatar) {
      await diskStorage.deletefile(dishes.avatar);
    }

    const filename = await diskStorage.saveFile(avatarFileName);
    dishes.avatar = filename;

    await knex("dishes").update(dishes).where({ id: user_id });

    return response.json(dishes);
  }
}

module.exports = DishesAvatarController;
