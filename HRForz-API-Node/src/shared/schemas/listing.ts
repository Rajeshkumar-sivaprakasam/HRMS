import { z } from 'zod';

export const ListingFilterSchema = z.object({
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).passthrough();

export const PaginationInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  size: z.number().int().min(1).max(100).default(20),
});

export const ListingRequestSchema = z.object({
  filter: ListingFilterSchema.default({}),
  pagination: PaginationInputSchema.default({ page: 1, size: 20 }),
  paginationFlag: z.boolean().default(true),
});

export type ListingFilter = z.infer<typeof ListingFilterSchema>;
export type PaginationInput = z.infer<typeof PaginationInputSchema>;
export type ListingRequest = z.infer<typeof ListingRequestSchema>;

export function getListingParams(request: ListingRequest) {
  const { filter, pagination, paginationFlag } = request;
  return {
    filter,
    page: pagination.page,
    size: pagination.size,
    offset: (pagination.page - 1) * pagination.size,
    limit: pagination.size,
    paginate: paginationFlag,
    sortBy: filter.sortBy,
    sortOrder: filter.sortOrder.toUpperCase() as 'ASC' | 'DESC',
  };
}
