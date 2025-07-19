'use client';

;
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { UserManagement } from '@/components/admin/UserManagement';
import { ADMIN_PERMISSIONS } from '@/lib/admin/auth';

export default function AdminUsersPage() {
  return (
    <AdminGuard requiredPermission={ADMIN_PERMISSIONS.USERS_READ}>
      <AdminLayout currentPage="users">
        <UserManagement />
      </AdminLayout>
    </AdminGuard>
  );
}
