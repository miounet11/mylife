import { redirect } from 'next/navigation';
import { requireAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Admin home → ops dashboard. */
export default async function AdminIndexPage() {
  await requireAdminUser('/admin/dashboard');
  redirect('/admin/dashboard');
}
