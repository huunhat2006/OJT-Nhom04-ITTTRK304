interface CategoryIconProps {
  icon?: string | null;
  className?: string;
}

export function CategoryIcon({ icon, className }: CategoryIconProps) {
  return (
    <span className={className} aria-hidden="true">
      {icon?.trim() || '📦'}
    </span>
  );
}
