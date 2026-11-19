import { pageMeta } from '@/lib/pageMeta';

// link preview for /admin/test-students
export const metadata = pageMeta('admin-test-students');

export default function Layout({ children }) {
  return children;
}
