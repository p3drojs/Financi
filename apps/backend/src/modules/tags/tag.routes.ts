import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { deleteTagHandler, listTagsHandler } from './tag.controller';
import { tagIdParamSchema } from './tag.schema';

export const tagRouter = Router();

tagRouter.use(authMiddleware);

tagRouter.get('/', listTagsHandler);
tagRouter.delete('/:id', validate(tagIdParamSchema), deleteTagHandler);
