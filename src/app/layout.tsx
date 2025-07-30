import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from '@/components/ui/toaster';
import { ResidencesProvider } from '@/context/residences-context';
import { InventoryProvider } from '@/context/inventory-context';
import { UsersProvider } from '@/context/users-context';
import { OrdersProvider } from '@/context/orders-context';
import { MaintenanceProvider } from '@/context/maintenance-context';
import { LanguageProvider } from '@/context/language-context';
import { NotificationsProvider } from '@/context/notifications-context';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <LanguageProvider>
          <ResidencesProvider>
            <UsersProvider>
              <NotificationsProvider>
                <InventoryProvider>
                  <OrdersProvider>
                    <MaintenanceProvider>
                      <AppLayout>{children}</AppLayout>
                    </MaintenanceProvider>
                  </OrdersProvider>
                </InventoryProvider>
              </NotificationsProvider>
            </UsersProvider>
          </ResidencesProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
