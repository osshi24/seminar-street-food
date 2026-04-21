import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Providers from '../components/Providers';

export const metadata: Metadata = {
  title: 'Phố Ẩm Thực',
  description: 'Hệ thống Web Phố Ẩm Thực',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            async
            src="/umami/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-host-url="/umami"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
