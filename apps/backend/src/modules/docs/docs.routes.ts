import path from 'node:path';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const openapiDocument = YAML.load(path.join(__dirname, '../../../openapi.yaml'));

export const docsRouter = Router();

docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(openapiDocument));
