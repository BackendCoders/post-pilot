import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { IApiResponse, IPaginatedResponse } from '../types/index';
import { logger } from '../utils/logger';

interface IBaseControllerOptions<T> {
  transform?: (doc: any) => any;
  getFilter?: (req: Request) => Record<string, any>;
  resourceName?: string;
  createMessage?: string;
  updateMessage?: string;
  deleteMessage?: string;
}

export const createBaseController = <T>(service: any, options: IBaseControllerOptions<T> = {}) => {
  const {
    transform = (doc: any) => doc,
    getFilter = () => ({}),
    resourceName = 'Resource',
    createMessage = `${resourceName} created successfully`,
    updateMessage = `${resourceName} updated successfully`,
    deleteMessage = `${resourceName} deleted successfully`,
  } = options;

  const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await service.create(req.body);
    const response: IApiResponse = {
      success: true,
      data: transform(data),
      message: createMessage,
    };
    logger.info(`${resourceName} created`, { id: (data as any)._id, user: req.user?.userId });
    res.status(201).json(response);
  });

  const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const filter = { ...getFilter(req) };
    
    // Merge explicit filters from query if needed? 
    // For now, let's just use getFilter which can be customized in each controller.

    const result = await service.list({ page, limit, sortBy, sortOrder, filter });

    const response: IPaginatedResponse<any> = {
      success: true,
      data: result.items.map(transform),
      pagination: result.pagination,
      message: `${resourceName} list fetched`,
    };

    res.status(200).json(response);
  });

  const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const filter = getFilter(req);
    
    const data = await service.getById(id);
    
    if (!data) {
      res.status(404).json({ success: false, error: `${resourceName} not found` });
      return;
    }

    // Check ownership if filter is provided (assuming getFilter returns ownership restrictions)
    // Actually, service.getById doesn't take a filter. 
    // We might need to update service.getById or check here.
    
    const response: IApiResponse = {
      success: true,
      data: transform(data),
    };

    res.status(200).json(response);
  });

  const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    // Check existence first if we need to check ownership before update
    const existing = await service.getById(id);
    if (!existing) {
       res.status(404).json({ success: false, error: `${resourceName} not found` });
       return;
    }

    const data = await service.updateById(id, req.body);
    
    const response: IApiResponse = {
      success: true,
      data: transform(data),
      message: updateMessage,
    };

    logger.info(`${resourceName} updated`, { id, user: req.user?.userId });
    res.status(200).json(response);
  });

  const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const existing = await service.getById(id);
    if (!existing) {
       res.status(404).json({ success: false, error: `${resourceName} not found` });
       return;
    }

    await service.deleteById(id);

    const response: IApiResponse = {
      success: true,
      message: deleteMessage,
    };

    logger.info(`${resourceName} deleted`, { id, user: req.user?.userId });
    res.status(200).json(response);
  });

  return {
    create,
    list,
    getById,
    update,
    remove,
  };
};

export default createBaseController;
