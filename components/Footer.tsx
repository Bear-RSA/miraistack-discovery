import Link from 'next/link';

export default function Footer({ linkHref = '/privacy', linkLabel = 'Privacy Policy' }: { linkHref?: string; linkLabel?: string }) {
  return (
    <footer className="footer">
      <span>&copy; 2026 Mirai Stack</span>
      <Link href={linkHref} className="footer-link">{linkLabel}</Link>
    </footer>
  );
}
