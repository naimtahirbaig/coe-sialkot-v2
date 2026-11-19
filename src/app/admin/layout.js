import { pageMeta } from '@/lib/pageMeta';

// link preview for /admin
export const metadata = pageMeta('admin');

export default function Layout({ children }) {
  return children;
}
