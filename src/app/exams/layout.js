import { pageMeta } from '@/lib/pageMeta';

export const metadata = pageMeta('exams');

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function ExamsLayout({ children }) {
  return children;
}
