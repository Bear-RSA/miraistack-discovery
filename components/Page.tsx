import { ViewTransition } from 'react';

// Every route wraps its content in this so navigations cross-fade
// (see ::view-transition-*(.page) in globals.css). Browsers without the
// View Transitions API simply swap pages instantly.
export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition default="page">
      <div className="screen">{children}</div>
    </ViewTransition>
  );
}
