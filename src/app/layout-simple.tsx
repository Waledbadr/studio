import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EstateCare',
  description: 'Residential Complex Maintenance Management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
