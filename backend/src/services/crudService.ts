import { Document, Model, Types } from 'mongoose';

export interface IListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

export const createCrudService = <T extends Document>(model: Model<T>) => {
  const create = async (payload: Partial<T>) => {
    const doc = new model(payload as any);
    return await doc.save();
  };

  const getById = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) return null;
    return model.findById(id).exec();
  };

  const updateById = async (id: string, payload: Partial<T>) => {
    if (!Types.ObjectId.isValid(id)) return null;
    return model.findByIdAndUpdate(id, payload as any, { new: true }).exec();
  };

  const deleteById = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) return null;
    return model.findByIdAndDelete(id).exec();
  };

  const list = async (options: IListOptions = {}) => {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;
    const sortField = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
    const filter = options.filter || {};

    const query = model.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limit);

    const [items, total] = await Promise.all([query.exec(), model.countDocuments(filter).exec()]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  };

  return {
    create,
    getById,
    updateById,
    deleteById,
    list,
  };
};

export default createCrudService;
