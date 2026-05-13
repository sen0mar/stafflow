import { z } from "zod";

export const pageQuerySchema = z.coerce.number().int().min(1).default(1);
export const limitQuerySchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(10);

export interface PaginationMeta {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<TItem> {
  data: TItem[];
  meta: PaginationMeta;
}

export const getPaginationParams = ({
  limit,
  page,
}: {
  limit: number;
  page: number;
}) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const getPaginationMeta = ({
  limit,
  page,
  total,
}: {
  limit: number;
  page: number;
  total: number;
}): PaginationMeta => ({
  limit,
  page,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export const toPaginatedResult = <TItem>({
  data,
  limit,
  page,
  total,
}: {
  data: TItem[];
  limit: number;
  page: number;
  total: number;
}): PaginatedResult<TItem> => ({
  data,
  meta: getPaginationMeta({ limit, page, total }),
});
