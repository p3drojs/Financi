import { NextFunction, Request, Response } from 'express';
import * as categoryService from './category.service';
import { ListCategoriesQuery } from './category.schema';

export async function createCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await categoryService.createCategory(req.userId as string, req.body);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function listCategoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await categoryService.listCategories(
      req.userId as string,
      req.query as unknown as ListCategoriesQuery,
    );
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
}

export async function getCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await categoryService.getCategoryById(
      req.userId as string,
      req.params.id as string,
    );
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await categoryService.updateCategory(
      req.userId as string,
      req.params.id as string,
      req.body,
    );
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await categoryService.deleteCategory(req.userId as string, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
