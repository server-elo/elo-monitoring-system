'use client';

;
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { CommunityManagement } from '@/components/admin/CommunityManagement';
import { ADMIN_PERMISSIONS } from '@/lib/admin/auth';

export default function AdminCommunityPage() {
  return (
    <AdminGuard requiredPermission={ADMIN_PERMISSIONS.COMMUNITY_READ}>
      <AdminLayout currentPage="community">
        <CommunityManagement />
      </AdminLayout>
    </AdminGuard>
  );
}
