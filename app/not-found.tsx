import { Metadata } from 'next';
import { NotFoundPage } from '@/components/error-handling/NotFoundPage';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Solidity Learning Platform',
  description: 'The page you are looking for could not be found. Explore our courses and continue your Solidity learning journey.',
  robots: 'noindex, nofollow',
};

export default function NotFound() {
  return <NotFoundPage />;
}
