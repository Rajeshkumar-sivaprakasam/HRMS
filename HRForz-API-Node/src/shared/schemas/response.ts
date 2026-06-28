export interface ApiResponse<T> {
  message: string;
  response: T | null;
  code: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginatedResponse<T> {
  message: string;
  response: PaginatedData<T>;
  code: string;
}

export class ApiResponseBuilder {
  static ok<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return {
      message,
      response: data,
      code: 'SUCCESS',
    };
  }

  static created<T>(data: T, message: string): ApiResponse<T> {
    return {
      message,
      response: data,
      code: 'CREATED',
    };
  }

  static noContent(message: string = 'Deleted successfully'): ApiResponse<null> {
    return {
      message,
      response: null,
      code: 'SUCCESS',
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
    message: string = 'Records fetched'
  ): PaginatedResponse<T> {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
      message,
      response: {
        data,
        meta: {
          page,
          pageSize,
          totalRecords: total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      code: 'SUCCESS',
    };
  }
}
