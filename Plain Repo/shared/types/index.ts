// Shared types for Plain Repo
// These types can be used by both frontend and backend

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExampleItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// HTTP response status types
export type HttpStatus = 200 | 201 | 400 | 401 | 403 | 404 | 422 | 500;

// Common query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
}

// Combined query params
export interface QueryParams extends PaginationParams, SortParams, FilterParams {}

// API error response
export interface ApiError {
  error: string;
  message: string;
  status: HttpStatus;
  timestamp: string;
  details?: any;
}