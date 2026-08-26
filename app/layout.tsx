import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Commitment Pools — Proof over promises',
  description: 'Join stake-backed commitments with immutable terms, scheduled proof rounds, minimum-cohort refunds, and transparent settlement.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Commitment Pools — Proof over promises',
    description: 'Stake on clear terms. Prove each scheduled round. Finish together.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
