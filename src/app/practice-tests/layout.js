export const metadata = {
  title: 'Practice Tests — COE Sialkot (Boys)',
  description: 'Interactive MCQ quizzes and practice tests for classes 6-10. Flashcards, Type the Term, Match modes. Free for all students. Centre of Excellence Sialkot Boys.',
  metadataBase: new URL('https://www.coesialkot.com'),
  openGraph: {
    title: '🧪 Practice Tests — COE Sialkot (Boys)',
    description: 'Free interactive quizzes: MCQ, Flashcards, Type the Term & Match. Classes 6-10. No login required.',
    url: 'https://www.coesialkot.com/practice-tests',
    siteName: 'COE Sialkot (Boys)',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'COE Sialkot Practice Tests' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '🧪 Practice Tests — COE Sialkot (Boys)',
    description: 'Free interactive quizzes for classes 6-10. MCQ, Flashcards & more.',
    images: ['/logo.png'],
  },
};

export default function Layout({ children }) {
  return children;
}
