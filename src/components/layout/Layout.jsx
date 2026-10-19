import { brand } from '../../brand/brand.js';
import { useI18n } from '../../i18n/index.jsx';
import { useCart } from '../../state/cart.jsx';
import { href, useRoute } from '../../router.js';
import { useDelivery } from '../shop/useDelivery.js';
import { IconBag, IconClock, IconPin } from '../shop/icons.jsx';
import Wordmark from '../../brand/Wordmark.jsx';
import './layout.css';

// Shared page shell for the 2D pages (express shop, cart, checkout, info).
// Owned by the express-shop package; other pages only wrap their content.
export default function Layout({ children }) {
  const { t, price } = useI18n();
  const { count, total } = useCart();
  const { mode, setMode, address, setAddress } = useDelivery();
  const path = useRoute().split('?')[0];
  const link = (to, label) => (
    <a href={href(to)} className={path === to ? 'is-current' : undefined} aria-current={path === to ? 'page' : undefined}>
      {label}
    </a>
  );
  const [etaMin, etaMax] = brand.delivery.etaMinutes;
  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__bar">
          <a href={href('/')} className="layout__logo">
            <Wordmark />
          </a>
          <nav className="layout__nav" aria-label="Navigation">
            {link('/', t('nav.experience'))}
            {link('/bestellen', t('nav.order'))}
            {link('/info', t('nav.info'))}
          </nav>

          <div className="layout__service">
            <div className="layout__mode" role="radiogroup" aria-label={t('shop.header.mode')}>
              {['delivery', 'pickup'].map(m => (
                <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => setMode(m)}>
                  {t(`shop.header.${m}`)}
                </button>
              ))}
            </div>

            {mode === 'delivery' ? (
              <label className="layout__address">
                <IconPin width={18} height={18} />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={t('shop.header.addressPlaceholder')}
                  aria-label={t('shop.header.addressLabel')}
                  autoComplete="street-address"
                />
              </label>
            ) : (
              <p className="layout__address layout__address--static" title={t('shop.header.pickupAt', brand.contact)}>
                <IconPin width={18} height={18} />
                <span>
                  {brand.contact.street}, {brand.contact.city}
                </span>
              </p>
            )}

            <p className="layout__eta">
              <IconClock width={18} height={18} />
              <span>{mode === 'delivery' ? t('shop.header.eta', { min: etaMin, max: etaMax }) : t('shop.header.pickupEta')}</span>
            </p>
          </div>

          <a href={href('/warenkorb')} className="layout__cart" aria-label={`${t('shop.header.cartButton')}: ${count} · ${price(total)}`}>
            <span className="layout__cart-icon">
              <IconBag width={20} height={20} />
              {count > 0 && <span className="layout__cart-count">{count}</span>}
            </span>
            <span className="layout__cart-total">{price(total)}</span>
          </a>
        </div>
      </header>
      <main className="layout__main">{children}</main>
    </div>
  );
}
