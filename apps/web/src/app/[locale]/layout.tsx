import {
  Cairo,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Noto_Naskh_Arabic,
  Playfair_Display,
} from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { type ReactNode } from 'react';

import { isRtl, locales, localeMeta, type Locale } from '@/i18n/config';
import { getTheme } from '@/lib/theme/get-theme';

import '../../styles/globals.css';

import type { Metadata } from 'next';

// EN display + body
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

// AR display + body
const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  variable: '--font-display-ar',
  display: 'swap',
});
const notoNaskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-sans-ar',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Hikaya — Tell your story',
    template: '%s · Hikaya',
  },
  description:
    'All-in-one platform for creative professionals. Showcase work, get hired, run your studio, deliver to clients.',
  applicationName: 'Hikaya',
  alternates: {
    canonical: '/',
    languages: { en: '/en', ar: '/ar' },
  },
  openGraph: {
    title: 'Hikaya — Tell your story',
    description: 'All-in-one platform for creative professionals.',
    siteName: 'Hikaya',
    type: 'website',
  },
  icons: { icon: '/favicon.ico' },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  const dir = isRtl(locale) ? 'rtl' : 'ltr';
  const htmlLang = localeMeta[locale].htmlLang;
  const theme = await getTheme();

  return (
    <html
      lang={htmlLang}
      dir={dir}
      data-theme={theme ?? undefined}
      className={[
        playfair.variable,
        plexSans.variable,
        plexMono.variable,
        cairo.variable,
        notoNaskh.variable,
      ].join(' ')}
    >
      <head>
        {/* Anti-FOUC: when no cookie picked the theme server-side, let
            localStorage win before paint. Honors OS preference otherwise. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;if(d.dataset.theme)return;var s=localStorage.getItem('hikaya_theme');if(s==='dark'||s==='light'){d.dataset.theme=s;return;}var m=window.matchMedia('(prefers-color-scheme: dark)').matches;d.dataset.theme=m?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-surface min-h-dvh antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
