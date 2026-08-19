import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createCategoryHandler,
  deleteCategoryHandler,
  getCategoryHandler,
  listCategoriesHandler,
  updateCategoryHandler,
} from './category.controller';
import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from './category.schema';

export const categoryRouter = Router();

categoryRouter.use(authMiddleware);

categoryRouter.post('/', validate(createCategorySchema), createCategoryHandler);
categoryRouter.get('/', validate(listCategoriesSchema), listCategoriesHandler);
categoryRouter.get('/:id', validate(categoryIdParamSchema), getCategoryHandler);
categoryRouter.patch('/:id', validate(updateCategorySchema), updateCategoryHandler);
categoryRouter.delete('/:id', validate(categoryIdParamSchema), deleteCategoryHandler);
