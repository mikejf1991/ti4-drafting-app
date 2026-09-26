import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Galaxy Draft | Twilight Imperium Fourth Edition',
  description: 'An eight-player galaxy draft for Twilight Imperium Fourth Edition.',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
