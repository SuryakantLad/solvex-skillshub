import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import Providers from '@/components/providers/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: {
    default: 'TalentGraph AI — Skills Intelligence Platform',
    template: '%s | TalentGraph AI',
  },
  description:
    'AI-powered skills intelligence platform for modern HR teams. Discover talent, map skills, and build high-performance teams.',
  keywords: ['HR', 'talent management', 'skills intelligence', 'AI', 'recruitment'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
