/**
 * Shared type definitions for components
 */

import { ReactElement, ReactNode, MouseEvent, ChangeEvent, FormEvent, KeyboardEvent } from 'react';

// Common event handler types
export type ClickHandler<T = HTMLElement> = (event: MouseEvent<T>) => void;
export type ChangeHandler<T = HTMLInputElement> = (event: ChangeEvent<T>) => void;
export type FormHandler = (event: FormEvent<HTMLFormElement>) => void;
export type KeyboardHandler<T = HTMLElement> = (event: KeyboardEvent<T>) => void;

// Common prop types
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
}

// Form-related types
export interface FormFieldProps {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Layout types
export interface LayoutProps extends BaseComponentProps {
  title?: string;
  description?: string;
}

// Modal types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactElement;
  badge?: string | number;
  children?: NavItem[];
}

// Table types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  width?: string | number;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  onRowClick?: (row: T, index: number) => void;
}

// Pagination types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
}

// Chart types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartProps {
  data: ChartDataPoint[];
  type?: 'bar' | 'line' | 'pie' | 'doughnut';
  height?: number | string;
  width?: number | string;
}

// User types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  bio?: string;
}

// Activity types
export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  user?: UserProfile;
  metadata?: Record<string, unknown>;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// WebSocket types
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  userId?: string;
}

// Editor types
export interface EditorOptions {
  language?: string;
  theme?: string;
  readOnly?: boolean;
  minimap?: { enabled: boolean };
  fontSize?: number;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
}

// Collaboration types
export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { start: number; end: number };
}

export interface CollaborationEvent {
  type: 'cursor-move' | 'selection-change' | 'content-change' | 'user-join' | 'user-leave';
  userId: string;
  data: unknown;
  timestamp: number;
}

// File types
export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: Date | string;
  children?: FileItem[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    totalPages?: number;
    totalItems?: number;
  };
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  digest?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}