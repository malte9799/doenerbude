// Everything brand-specific lives here. The shop, the 3D store and all
// packaging (sign, cups, boxes, wrap paper) read from this file only, so a
// rebrand means swapping this folder.

export const brand = {
  name: 'DönerBude',
  // The accented letter of the wordmark (rendered in the accent colour).
  wordmark: { before: 'D', accent: 'ö', after: 'nerBude' },
  slogan: 'Frisch vom Spieß. Heiß aus dem Ofen.',

  colors: {
    paper: '#FBF6EE',
    ink: '#22201E',
    red: '#D7362B',
    mustard: '#F2B233',
    herb: '#5E9A3A',
    muted: '#8A8178',
    line: '#E8DFD2',
  },

  fonts: {
    display: '"Rubik", "Arial Rounded MT Bold", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    // Google Fonts families to load (kept here so a rebrand swaps fonts too).
    googleFamilies: ['Rubik:wght@500;700;800', 'Inter:wght@400;500;600'],
  },

  contact: {
    street: 'Kastanienallee 12',
    city: '10435 Berlin',
    phone: '030 123 456 78',
  },

  hours: [
    { days: 'Mo–Do', time: '11:00–23:00' },
    { days: 'Fr–Sa', time: '11:00–01:00' },
    { days: 'So', time: '12:00–22:00' },
  ],

  delivery: {
    minOrder: 12,
    fee: 1.99,
    freeFrom: 25,
    etaMinutes: [25, 40],
  },

  currency: 'EUR',
  locale: 'de-DE',
};
