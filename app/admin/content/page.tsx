'use client';

;
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ContentManagement } from '@/components/admin/ContentManagement';
import { ADMIN_PERMISSIONS } from '@/lib/admin/auth';

export default function AdminContentPage() {
  return (
    <AdminGuard requiredPermission={ADMIN_PERMISSIONS.CONTENT_READ}>
      <AdminLayout currentPage="content">
        <ContentManagement />
      </AdminLayout>
    </AdminGuard>
  );
}
