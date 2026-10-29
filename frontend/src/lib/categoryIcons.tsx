import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  DollarSign,
  Folder,
  Gift,
  Heart,
  Home,
  Laptop,
  Landmark,
  MoreHorizontal,
  Phone,
  PiggyBank,
  ShieldCheck,
  ShoppingBag,
  Smile,
  Store,
  TrendingUp,
  User,
  Wallet,
  Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  shop: Store,
  store: Store,
  rise: TrendingUp,
  investment: TrendingUp,
  laptop: Laptop,
  freelance: Laptop,
  gift: Gift,
  dollar: DollarSign,
  money: Banknote,
  coffee: Coffee,
  food: Coffee,
  car: Car,
  transport: Car,
  home: Home,
  housing: Home,
  heart: Heart,
  health: Heart,
  book: BookOpen,
  education: BookOpen,
  shopping: ShoppingBag,
  smile: Smile,
  entertainment: Smile,
  thunder: Zap,
  utilities: Zap,
  phone: Phone,
  communication: Phone,
  user: User,
  personal: User,
  safety: ShieldCheck,
  insurance: ShieldCheck,
  fund: PiggyBank,
  savings: PiggyBank,
  bank: Landmark,
  business: Briefcase,
  ellipsis: MoreHorizontal,
  more: MoreHorizontal,
};

interface CategoryIconProps {
  icon?: string | null;
  className?: string;
}

export function CategoryIcon({ icon, className }: CategoryIconProps) {
  if (!icon) {
    return <Folder className={className} />;
  }

  const Icon = ICON_MAP[icon.trim().toLowerCase()];
  if (Icon) {
    return <Icon className={className} />;
  }

  return (
    <span className={className} style={{ lineHeight: 1 }}>
      {icon}
    </span>
  );
}
