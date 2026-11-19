import { pageMeta } from '@/lib/pageMeta';

// link preview for /admin/students
export const metadata = pageMeta('admin-students');

export default function Layout({ children }) {
  return children;
}
