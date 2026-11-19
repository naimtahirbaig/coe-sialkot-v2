import { pageMeta } from '@/lib/pageMeta';

// link preview for /portal/admin
export const metadata = pageMeta('portal-admin');

export default function Layout({ children }) {
  return children;
}
