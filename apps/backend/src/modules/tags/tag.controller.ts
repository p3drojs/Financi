import { NextFunction, Request, Response } from 'express';
import * as tagService from './tag.service';

export async function listTagsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tags = await tagService.listTags(req.userId as string);
    res.status(200).json(tags);
  } catch (err) {
    next(err);
  }
}

export async function deleteTagHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await tagService.deleteTag(req.userId as string, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
