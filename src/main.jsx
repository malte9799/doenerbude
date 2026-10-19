import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { brand } from './brand/brand.js';
import { I18nProvider } from './i18n/index.jsx';
import { CartProvider } from './state/cart.jsx';
import App from './App.jsx';
import './styles/base.css';

// Brand tokens → CSS custom properties, fonts → Google Fonts.
const root = document.documentElement.style;
for (const [name, value] of Object.entries(brand.colors)) root.setProperty(`--c-${name}`, value);
root.setProperty('--f-display', brand.fonts.display);
root.setProperty('--f-body', brand.fonts.body);

const fonts = document.createElement('link');
fonts.rel = 'stylesheet';
fonts.href = `https://fonts.googleapis.com/css2?${brand.fonts.googleFamilies.map(f => `family=${f}`).join('&')}&display=swap`;
document.head.append(fonts);
document.title = brand.name;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </I18nProvider>
  </StrictMode>,
);
