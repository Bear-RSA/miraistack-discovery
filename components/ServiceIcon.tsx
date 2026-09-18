import { PanelsTopLeft, ShoppingCart, Smartphone, AppWindow, Database, Bot, Palette, Building2, type LucideProps } from 'lucide-react';
import type { IconName } from '@/lib/config';

const ICONS: Record<IconName, React.ComponentType<LucideProps>> = {
  'layout': PanelsTopLeft,
  'shopping-cart': ShoppingCart,
  'smartphone': Smartphone,
  'app-window': AppWindow,
  'database': Database,
  'bot': Bot,
  'palette': Palette,
  'building-2': Building2,
};

export default function ServiceIcon({ name, size = 16 }: { name: IconName; size?: number }) {
  const Icon = ICONS[name];
  return <Icon size={size} strokeWidth={2} aria-hidden />;
}
