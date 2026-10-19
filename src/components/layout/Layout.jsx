import { useI18n } from '../../i18n/index.jsx';
import { useCart } from '../../state/cart.jsx';
import { href, useRoute } from '../../router.js';
import Wordmark from '../../brand/Wordmark.jsx';
import './layout.css';

// Shared page shell for the 2D pages (express shop, cart, checkout, info).
// Owned by the express-shop package; other pages only wrap their content.
export default function Layout({ children }) {
  const { t, price } = useI18n();
  const { count, total } = useCart();
  const path = useRoute();
  const link = (to, label) => (
    <a href={href(to)} className={path === to ? 'is-current' : undefined}>
      {label}
    </a>
  );
  return (
    <div className="layout">
      <header className="layout__header">
        <a href={href('/')} className="layout__logo">
          <Wordmark />
        </a>
        <nav className="layout__nav">
          {link('/', t('nav.experience'))}
          {link('/bestellen', t('nav.order'))}
          {link('/info', t('nav.info'))}
        </nav>
        <a href={href('/warenkorb')} className="layout__cart">
          {t('nav.cart')} · {count} · {price(total)}
        </a>
      </header>
      <main className="layout__main">{children}</main>
    </div>
  );
}
