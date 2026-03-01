import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CardOS — AI-native digital business card',
  description: 'Create your digital business card in 60 seconds. Share via QR at any tech event.',
  openGraph: {
    title: 'CardOS — AI-native digital business card',
    description: 'Create your digital business card in 60 seconds. Share via QR at any tech event.',
    siteName: 'CardOS',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
