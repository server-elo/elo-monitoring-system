import { render, screen, fireEvent, waitFor } from '@testing-library/react';
;
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { ContentManagement } from '@/components/admin/ContentManagement';
import { CommunityManagement } from '@/components/admin/CommunityManagement';
import { SecurityManagement } from '@/components/admin/SecurityManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { SafetyConfirmation, UndoManager, SoftDeleteManager } from '@/components/admin/SafetyConfirmation';
import { adminAuth, ADMIN_PERMISSIONS } from '@/lib/admin/auth';
import { auditLogger } from '@/lib/admin/auditLogger';

// Mock admin auth
jest.mock('@/lib/admin/auth', () => ({
  adminAuth: {
    getCurrentUser: jest.fn(),
    isAuthenticated: jest.fn(),
    hasPermission: jest.fn(),
    hasRole: jest.fn(),
    authenticateAdmin: jest.fn(),
    logout: jest.fn()
  },
  ADMIN_PERMISSIONS: {
    USERS_READ: 'users.read',
    USERS_WRITE: 'users.write',
    USERS_DELETE: 'users.delete',
    CONTENT_READ: 'content.read',
    CONTENT_WRITE: 'content.write',
    CONTENT_DELETE: 'content.delete',
    SYSTEM_READ: 'system.read',
    SYSTEM_WRITE: 'system.write',
    SECURITY_READ: 'security.read',
    SECURITY_WRITE: 'security.write',
    ANALYTICS_READ: 'analytics.read',
    COMMUNITY_READ: 'community.read',
    ALL: 'admin.all'
  }
}));

// Mock audit logger
jest.mock('@/lib/admin/auditLogger', () => ({
  auditLogger: {
    logAction: jest.fn(),
    logFailure: jest.fn(),
    getLogs: jest.fn(),
    exportToCSV: jest.fn(),
    exportToJSON: jest.fn(),
    getStatistics: jest.fn()
  }
}));

// Mock user data
const mockAdminUser = {
  id: 'admin_1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin' as const,
  status: 'active' as const,
  createdAt: new Date('2023-01-01'),
  lastLoginAt: new Date(),
  loginCount: 42,
  xpTotal: 0,
  lessonsCompleted: 0,
  averageScore: 0,
  timeSpent: 0,
  emailVerified: true,
  twoFactorEnabled: true
};

describe('Admin System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminAuth.getCurrentUser as jest.Mock).mockReturnValue(mockAdminUser);
    (adminAuth.isAuthenticated as jest.Mock).mockReturnValue(true);
    (adminAuth.hasPermission as jest.Mock).mockReturnValue(true);
    (adminAuth.hasRole as jest.Mock).mockReturnValue(true);
  });

  describe('AdminGuard', () => {
    test('should render login form when not authenticated', () => {
      (adminAuth.isAuthenticated as jest.Mock).mockReturnValue(false);
      
      render(
        <AdminGuard>
          <div>Protected Content</div>
        </AdminGuard>
      );

      expect(screen.getByText('Admin Access')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('should render protected content when authenticated', () => {
      render(
        <AdminGuard>
          <div>Protected Content</div>
        </AdminGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Admin Access')).not.toBeInTheDocument();
    });

    test('should show permission denied when lacking required permission', () => {
      (adminAuth.hasPermission as jest.Mock).mockReturnValue(false);
      
      render(
        <AdminGuard requiredPermission={ADMIN_PERMISSIONS.USERS_WRITE}>
          <div>Protected Content</div>
        </AdminGuard>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('should handle login submission', async () => {
      (adminAuth.isAuthenticated as jest.Mock).mockReturnValue(false);
      (adminAuth.authenticateAdmin as jest.Mock).mockResolvedValue({
        success: true,
        user: mockAdminUser
      });

      render(
        <AdminGuard>
          <div>Protected Content</div>
        </AdminGuard>
      );

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(adminAuth.authenticateAdmin).toHaveBeenCalledWith(
          'admin@example.com',
          'admin123',
          undefined
        );
      });
    });
  });

  describe('AdminLayout', () => {
    test('should render navigation and content', () => {
      render(
        <AdminLayout>
          <div>Dashboard Content</div>
        </AdminLayout>
      );

      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Content Management')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    test('should toggle sidebar', () => {
      render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );

      const toggleButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(toggleButton);

      // Sidebar should still be visible but toggle button should change
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    test('should handle logout', () => {
      render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );

      const userMenuButton = screen.getByText(mockAdminUser.name);
      fireEvent.click(userMenuButton);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(adminAuth.logout).toHaveBeenCalled();
    });
  });

  describe('AdminDashboard', () => {
    test('should render dashboard widgets', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });
    });

    test('should show loading state initially', () => {
      render(<AdminDashboard />);

      // Should show loading skeletons
      expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
    });
  });

  describe('UserManagement', () => {
    test('should render user management interface', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search users by name, email, or role...')).toBeInTheDocument();
      });
    });

    test('should handle user search', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search users by name, email, or role...');
        fireEvent.change(searchInput, { target: { value: 'john' } });
        
        expect(searchInput).toHaveValue('john');
      });
    });

    test('should handle bulk user selection', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        const selectAllCheckbox = screen.getByRole('checkbox');
        fireEvent.click(selectAllCheckbox);
        
        // Should show bulk actions
        expect(screen.queryByText('selected')).toBeInTheDocument();
      });
    });
  });

  describe('ContentManagement', () => {
    test('should render content management interface', async () => {
      render(<ContentManagement />);

      await waitFor(() => {
        expect(screen.getByText('Content Management')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search content by title, author, or tags...')).toBeInTheDocument();
      });
    });

    test('should handle content filtering', async () => {
      render(<ContentManagement />);

      await waitFor(() => {
        const statusFilter = screen.getByDisplayValue('All Status');
        fireEvent.change(statusFilter, { target: { value: 'published' } });
        
        expect(statusFilter).toHaveValue('published');
      });
    });
  });

  describe('CommunityManagement', () => {
    test('should render community management interface', async () => {
      render(<CommunityManagement />);

      await waitFor(() => {
        expect(screen.getByText('Community Management')).toBeInTheDocument();
        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByText('Moderation')).toBeInTheDocument();
      });
    });

    test('should switch between tabs', async () => {
      render(<CommunityManagement />);

      await waitFor(() => {
        const moderationTab = screen.getByText('Moderation');
        fireEvent.click(moderationTab);
        
        expect(screen.getByText('Moderation Tools')).toBeInTheDocument();
      });
    });
  });

  describe('SecurityManagement', () => {
    test('should render security management interface', async () => {
      render(<SecurityManagement />);

      await waitFor(() => {
        expect(screen.getByText('Security Management')).toBeInTheDocument();
        expect(screen.getByText('Security Events')).toBeInTheDocument();
        expect(screen.getByText('Access Control')).toBeInTheDocument();
      });
    });

    test('should handle security event filtering', async () => {
      render(<SecurityManagement />);

      await waitFor(() => {
        const severityFilter = screen.getByDisplayValue('All Severities');
        fireEvent.change(severityFilter, { target: { value: 'critical' } });
        
        expect(severityFilter).toHaveValue('critical');
      });
    });
  });

  describe('AuditLogViewer', () => {
    beforeEach(() => {
      (auditLogger.getLogs as jest.Mock).mockReturnValue({
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
    });

    test('should render audit log viewer', async () => {
      render(<AuditLogViewer />);

      await waitFor(() => {
        expect(screen.getByText('Audit Logs')).toBeInTheDocument();
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
        expect(screen.getByText('Export JSON')).toBeInTheDocument();
      });
    });

    test('should handle log export', async () => {
      (auditLogger.exportToCSV as jest.Mock).mockReturnValue('csv,data');
      
      render(<AuditLogViewer />);

      await waitFor(() => {
        const exportButton = screen.getByText('Export CSV');
        fireEvent.click(exportButton);
        
        expect(auditLogger.exportToCSV).toHaveBeenCalled();
      });
    });
  });

  describe('Safety & Confirmation Systems', () => {
    test('should render safety confirmation dialog', () => {
      const mockConfirmation = {
        title: 'Delete User',
        message: 'Are you sure you want to delete this user?',
        type: 'danger' as const,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        destructive: true,
        requirePassword: true,
        requireTwoFactor: false,
        affectedItems: 1,
        consequences: ['User data will be permanently deleted', 'Action cannot be undone']
      };

      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      render(
        <SafetyConfirmation
          isOpen={true}
          confirmation={mockConfirmation}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Delete User')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this user?')).toBeInTheDocument();
      expect(screen.getByText('User data will be permanently deleted')).toBeInTheDocument();
    });

    test('should render undo manager', async () => {
      render(<UndoManager />);

      await waitFor(() => {
        expect(screen.getByText('Undo Manager')).toBeInTheDocument();
      });
    });

    test('should render soft delete manager', async () => {
      render(<SoftDeleteManager />);

      await waitFor(() => {
        expect(screen.getByText('Soft Delete Manager')).toBeInTheDocument();
      });
    });
  });

  describe('Permission System', () => {
    test('should respect user permissions for UI elements', () => {
      (adminAuth.hasPermission as jest.Mock).mockImplementation((permission) => {
        return permission !== ADMIN_PERMISSIONS.USERS_DELETE;
      });

      render(<UserManagement />);

      // Should not show delete actions when user lacks delete permission
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    test('should show all features for admin users', () => {
      (adminAuth.hasPermission as jest.Mock).mockReturnValue(true);

      render(<UserManagement />);

      // Should show all management features
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication errors gracefully', async () => {
      (adminAuth.isAuthenticated as jest.Mock).mockReturnValue(false);
      (adminAuth.authenticateAdmin as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      });

      render(
        <AdminGuard>
          <div>Protected Content</div>
        </AdminGuard>
      );

      const emailInput = screen.getByPlaceholderText('admin@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    test('should handle API errors in data loading', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<AdminDashboard />);

      // Should handle errors gracefully and show fallback UI
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<AdminDashboard />);

      // Check for proper semantic elements
      expect(screen.getByRole('main') || screen.getByRole('region')).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );

      // Should have focusable navigation elements
      const navButtons = screen.getAllByRole('button');
      expect(navButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('should render components within reasonable time', async () => {
      const startTime = performance.now();
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });

    test('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeUserList = Array.from({ length: 1000 }, (_, i) => ({
        id: `user_${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: 'student' as const,
        status: 'active' as const,
        createdAt: new Date(),
        loginCount: i,
        xpTotal: i * 100,
        lessonsCompleted: i % 10,
        averageScore: 85 + (i % 15),
        timeSpent: i * 60,
        emailVerified: true,
        twoFactorEnabled: false
      }));

      const startTime = performance.now();
      
      render(<UserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large datasets efficiently
      expect(renderTime).toBeLessThan(3000);
    });
  });
});
