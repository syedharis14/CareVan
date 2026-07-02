import type { Metadata } from 'next';
import { TokenStyle } from '@/components/TokenStyle';
import './globals.css';

export const metadata: Metadata = {
  title: 'CareVan Admin',
  description: 'CareVan internal operations panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TokenStyle />
        {children}
      </body>
    </html>
  );
}
