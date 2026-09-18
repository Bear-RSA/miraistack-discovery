import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mirai Stack — Project Discovery',
  description: "Answer a few questions about your business and we'll scope your project and recommend the right service tier.",
};

// Zoom is never locked: people who enlarge text should be able to.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b101e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="ambient" aria-hidden />
        <div className="grain" aria-hidden />
        <div className="ambient-edge" aria-hidden />
        <div className="stage">{children}</div>
      </body>
    </html>
  );
}
