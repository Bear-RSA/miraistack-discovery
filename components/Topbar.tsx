import Link from 'next/link';
import Image from 'next/image';

// Translucent chrome: page content scrolls under it (see .topbar in globals.css).
export default function Topbar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="logo" aria-label="Mirai Stack home">
          <Image src="/logo.png" alt="Mirai Stack" className="logo-img" width={160} height={40} priority />
        </Link>
        {children}
      </div>
    </header>
  );
}
