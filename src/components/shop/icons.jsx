// Small inline icon set (stroke icons, currentColor). No emoji.
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const IconPlus = p => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconMinus = p => (
  <svg {...base} {...p}><path d="M5 12h14" /></svg>
);
export const IconClose = p => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconSearch = p => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
);
export const IconPin = p => (
  <svg {...base} {...p}><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
);
export const IconClock = p => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const IconBag = p => (
  <svg {...base} {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 016 0V8" /></svg>
);
export const IconCheck = p => (
  <svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconTrash = p => (
  <svg {...base} {...p}><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>
);
export const IconStar = ({ size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.6l-5.4 3 1.1-6.1L3.2 9.2l6.1-.8L12 2.8z" />
  </svg>
);

// Tile glyphs for products without a 3D model (one per category, filled shapes).
const glyph = { width: 64, height: 64, viewBox: '0 0 64 64', fill: 'currentColor', 'aria-hidden': true };
export const CategoryGlyph = ({ category }) => {
  switch (category) {
    case 'doener':
      return (
        <svg {...glyph}><path d="M10 34c0-12 10-20 22-20s22 8 22 20v4H10v-4z" opacity=".9" /><path d="M8 42h48l-4 10a6 6 0 01-5.6 4H17.6A6 6 0 0112 52L8 42z" /></svg>
      );
    case 'pizza':
      return (
        <svg {...glyph}><circle cx="32" cy="32" r="22" opacity=".9" /><circle cx="24" cy="26" r="4" fill="var(--c-paper)" /><circle cx="39" cy="31" r="4" fill="var(--c-paper)" /><circle cx="29" cy="41" r="3.5" fill="var(--c-paper)" /></svg>
      );
    case 'drinks':
      return (
        <svg {...glyph}><path d="M18 14h28l-3 38a5 5 0 01-5 4.6H26a5 5 0 01-5-4.6L18 14z" /><path d="M32 14l6-9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" /></svg>
      );
    case 'desserts':
      return (
        <svg {...glyph}><path d="M8 40l24-22 24 22v6H8v-6z" opacity=".9" /><rect x="8" y="46" width="48" height="8" rx="3" /></svg>
      );
    case 'sauces':
      return (
        <svg {...glyph}><rect x="22" y="22" width="20" height="34" rx="7" /><rect x="27" y="8" width="10" height="14" rx="3" opacity=".9" /></svg>
      );
    default:
      return (
        <svg {...glyph}><ellipse cx="32" cy="38" rx="24" ry="12" /><path d="M12 36c2-14 10-20 20-20s18 6 20 20H12z" opacity=".9" /></svg>
      );
  }
};
