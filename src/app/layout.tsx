import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { MobileNav } from '@/components/MobileNav';

export const metadata: Metadata = {
  title: 'Hublancer',
  description: 'Your hub for finding and completing tasks.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').then(registration => {
                      console.log('SW registered: ', registration);
                    }).catch(registrationError => {
                      console.log('SW registration failed: ', registrationError);
                    });
                  });
                }
              `,
            }}
          />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""/>
         <meta name="theme-color" content="#4DB6AC" />
      </head>
      <body className="font-body antialiased pb-16 md:pb-0">
        <AuthProvider>
          {children}
          <MobileNav />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
