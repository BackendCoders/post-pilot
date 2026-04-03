import { Router } from 'express';
import { z } from 'zod';
import { authenticate, validateRequest } from '../../../middleware';
import {
    createMessageTemplate,
    deleteMessageTemplate,
    getMessageTemplate,
    listMessageTemplates,
    updateMessageTemplate,
} from '../controller/template.controller';

const router = Router();

// Reuse objectId validation from lead routes or define here
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid object id');

const templateFieldsSchema = z.object({
    user: objectId.optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    content: z.string().trim().min(1).optional(),
});

const createTemplateSchema = z.object({
    body: z.object({
        user: objectId.optional(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        content: z.string().trim().min(1),
    }),
});

const updateTemplateSchema = z.object({
    body: templateFieldsSchema,
    params: z.object({
        id: objectId,
    }),
});

const listTemplatesSchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        user: objectId.optional(),
        search: z.string().trim().optional(),
    }),
});

const templateIdSchema = z.object({
    params: z.object({
        id: objectId,
    }),
});

router.use(authenticate);

router.post('/', validateRequest(createTemplateSchema), createMessageTemplate);
router.get('/', validateRequest(listTemplatesSchema), listMessageTemplates);
router.get('/:id', validateRequest(templateIdSchema), getMessageTemplate);
router.patch('/:id', validateRequest(updateTemplateSchema), updateMessageTemplate);
router.delete('/:id', validateRequest(templateIdSchema), deleteMessageTemplate);

export default router;
