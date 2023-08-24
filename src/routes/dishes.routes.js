const { Router } = require("express");
const multer = require("multer");
const uploadConfig = require("../configs/upload");

const DishesController = require("../controllers/DishesController");
const DishesAvatarController = require("../controllers/DishesAvatarController");
const ensureAuthenticated = require("../middleware/ensureAuthenticated");

const disheRouter = Router();
const upload = multer(uploadConfig.MULTER);

const dishesController = new DishesController();
const dishesAvatarController = new DishesAvatarController();

disheRouter.use(ensureAuthenticated);

disheRouter.get("/:id", dishesController.index);
disheRouter.post("/", upload.single("avatar"), dishesController.create);
disheRouter.put("/:id", dishesController.update);
disheRouter.get("/:id", dishesController.show);
disheRouter.delete("/:id", dishesController.delete);
disheRouter.patch(
  "/avatar",
  ensureAuthenticated,
  upload.single("avatar"),
  dishesAvatarController.update
);

module.exports = disheRouter;
