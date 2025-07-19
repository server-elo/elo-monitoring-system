export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  status: 'active' | 'suspended' | 'banned';
  createdAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
  xpTotal: number;
  lessonsCompleted: number;
  averageScore: number;
  timeSpent: number; // in minutes
  suspensionReason?: string;
  suspensionExpiresAt?: Date;
  avatar?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastActivity?: Date;
  ipAddress?: string;
  location?: string;
}

export interface AdminContent {
  id: string;
  title: string;
  type: 'lesson' | 'tutorial' | 'module' | 'quiz';
  status: 'draft' | 'pending' | 'published' | 'archived';
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  version: number;
  completionRate: number;
  averageRating: number;
  totalViews: number;
  totalCompletions: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  tags: string[];
  description: string;
  content?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  beforeState?: any;
  afterState?: any;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'user' | 'content' | 'system' | 'security';
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  category: 'user' | 'content' | 'system' | 'security' | 'analytics';
  level: 'read' | 'write' | 'delete' | 'admin';
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: AdminPermission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'content' | 'comment' | 'forum_post';
  targetId: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'other';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  evidence?: string[];
}

export interface SecurityEvent {
  id: string;
  type: 'login_failure' | 'suspicious_activity' | 'permission_escalation' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  description: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalContent: number;
  publishedContent: number;
  pendingContent: number;
  totalCompletions: number;
  averageEngagement: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  serverLoad: number;
  databaseSize: number;
  storageUsed: number;
}

export interface BulkOperation {
  id: string;
  type: 'user_update' | 'content_update' | 'user_delete' | 'content_delete';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt: Date;
  completedAt?: Date;
  createdBy: string;
  parameters: Record<string, any>;
  results?: Record<string, any>;
  errors?: string[];
}

export interface AdminNotification {
  id: string;
  type: 'security' | 'system' | 'user' | 'content' | 'community';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface AdminFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  values?: any[];
}

export interface AdminSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminSearchParams {
  query?: string;
  filters?: AdminFilter[];
  sort?: AdminSort;
  pagination: AdminPagination;
}

export interface AdminActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
}

export interface AdminConfirmation {
  title: string;
  message: string;
  type: 'warning' | 'danger' | 'info';
  confirmText: string;
  cancelText: string;
  requirePassword?: boolean;
  requireTwoFactor?: boolean;
  destructive: boolean;
  affectedItems?: number;
  consequences?: string[];
}

export interface AdminUndo {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  expiresAt: Date;
  canUndo: boolean;
  undoData: any;
  affectedResources: string[];
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  title: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  changeLog: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface ModerationAction {
  id: string;
  type: 'warning' | 'strike' | 'suspension' | 'ban' | 'content_removal';
  targetType: 'user' | 'content';
  targetId: string;
  moderatorId: string;
  reason: string;
  duration?: number; // in hours
  expiresAt?: Date;
  createdAt: Date;
  isActive: boolean;
  appealable: boolean;
  appealedAt?: Date;
  appealReason?: string;
  appealStatus?: 'pending' | 'approved' | 'denied';
}

export interface AdminDashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'list' | 'table' | 'alert';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
  refreshInterval?: number;
  permissions: string[];
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  databaseConnections: number;
  activeUsers: number;
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  issues: string[];
}
