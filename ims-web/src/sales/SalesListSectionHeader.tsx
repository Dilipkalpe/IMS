import './SalesListSectionHeader.scss';

export interface SalesListSectionHeaderProps {
  title: string;
  iconGlyph: string;
}

export function SalesListSectionHeader({ title, iconGlyph }: SalesListSectionHeaderProps) {
  return (
    <header className="sales-list-section-header">
      <span className="icon-text sales-list-section-header__icon" aria-hidden>
        {iconGlyph}
      </span>
      <h2 className="sales-list-section-header__title">{title}</h2>
    </header>
  );
}
