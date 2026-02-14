import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/hooks/useAuth';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Synaptic – The Generative Memory Palace',
  description:
    'Transform cherished memories into immersive 3D spaces. Walk through memories together with loved ones, powered by AI.',
  keywords: ['memory', '3D', 'AI', 'multiplayer', 'legacy', 'nostalgia', 'immersive'],
  openGraph: {
    title: 'Synaptic – The Generative Memory Palace',
    description:
      'Transform cherished memories into immersive 3D spaces where people reconnect across distance.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Synaptic',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synaptic – The Generative Memory Palace',
    description:
      'Transform cherished memories into immersive 3D spaces.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-[#0a0a1a] text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
