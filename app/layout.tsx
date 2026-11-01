import type { Metadata } from 'next';
import Script from 'next/script';
import site from '../content/site.json';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: site.seo.title,
  description: site.seo.description,
  openGraph: { title: site.seo.title, description: site.seo.description, images: ['/og.png'], type: 'website' },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const code = site.goatcounterCode;
  const live = !code.includes('PLACEHOLDER');
  return (
    <html lang="en">
      <body>
        {children}
        {live && (
          <Script
            src="https://gc.zgo.at/count.js"
            strategy="lazyOnload"
            data-goatcounter={`https://${code}.goatcounter.com/count`}
          />
        )}
      </body>
    </html>
  );
}
