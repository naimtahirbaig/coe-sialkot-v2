import { pageMeta } from '@/lib/pageMeta';

export const metadata = pageMeta('result-cards');

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function ResultCardsLayout({ children }) {
  return children;
}
