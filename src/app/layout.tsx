import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "../components/layout/Providers";

export const metadata: Metadata = {
  title: "ReadVerse - Read Manga, Webtoons, Novels & Earn Real Merch",
  description: "The gamified reading platform where every chapter earns you points toward real hoodies, bookmarks, books, and decor.",
  referrer: 'no-referrer',
};

const BROWSER_DETECTION_SCRIPT = `
(function() {
  try {
    var ua = navigator.userAgent;
    var vendor = navigator.vendor || '';
    var uad = navigator.userAgentData;
    var isChromium = Boolean(window.chrome) || 
      Boolean(uad && uad.brands && uad.brands.some(function(b) { return b.brand === 'Chromium' || b.brand === 'Google Chrome'; })) ||
      (/Chrome/.test(ua) && /Google Inc/.test(vendor)) ||
      /Edg\\/|OPR\\/|Brave|Vivaldi/.test(ua);

    var doc = document.documentElement;
    if (isChromium) {
      doc.classList.add('is-chromium');
      doc.setAttribute('data-engine', 'chromium');
    } else if (/Firefox\\//.test(ua)) {
      doc.classList.add('is-gecko');
      doc.setAttribute('data-engine', 'gecko');
    } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      doc.classList.add('is-webkit');
      doc.setAttribute('data-engine', 'webkit');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="no-referrer" />
        <script
          dangerouslySetInnerHTML={{
            __html: BROWSER_DETECTION_SCRIPT,
          }}
        />
        <script src="https://js.puter.com/v2/" async></script>
      </head>
      <body className="bg-[#0a0b0f] text-zinc-100 antialiased selection:bg-fuchsia-500 selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
