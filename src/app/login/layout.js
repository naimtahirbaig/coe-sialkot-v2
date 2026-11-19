import { pageMeta } from '@/lib/pageMeta';

// link preview for /login
export const metadata = pageMeta('login');

export default function Layout({ children }) {
  return children;
}
