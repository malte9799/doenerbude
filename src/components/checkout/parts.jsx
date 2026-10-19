import { useI18n } from '../../i18n/index.jsx';
import { brand } from '../../brand/brand.js';
import { href } from '../../router.js';

export const Icon = ({ name, size = 20 }) => {
  const paths = {
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
    bag: 'M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    bike: 'M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 15l4-7h5l3 7M9 8L8 6H6',
    store: 'M4 10l1-5h14l1 5M4 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 6 0 2.5 2.5 0 0 0 5 0M5 12v8h14v-8',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    alert: 'M12 8v5M12 16.5v.01M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
};

// Subtotal / delivery fee / total block. `fee` is already resolved by the caller.
export function Totals({ subtotal, fee, total, feeLabel }) {
  const { t, price } = useI18n();
  return (
    <>
      <dl className="co-rows">
        <div>
          <dt>{t('cart.subtotal')}</dt>
          <dd>{price(subtotal)}</dd>
        </div>
        <div className={fee === 0 ? 'is-free' : undefined}>
          <dt>{feeLabel ?? t('cart.delivery')}</dt>
          <dd>{fee === 0 ? t('cart.deliveryFree') : price(fee)}</dd>
        </div>
        <div className="is-total">
          <dt>{t('cart.total')}</dt>
          <dd>{price(total)}</dd>
        </div>
      </dl>
      <p className="co-vat">{t('cart.inclVat')}</p>
    </>
  );
}

// Min-order warning and free-delivery progress (delivery only).
export function DeliveryHints({ subtotal }) {
  const { t, price } = useI18n();
  const { minOrder, freeFrom } = brand.delivery;
  const missingMin = Math.max(0, minOrder - subtotal);
  const missingFree = Math.max(0, freeFrom - subtotal);
  const pct = Math.min(100, (subtotal / freeFrom) * 100);
  return (
    <div className="co-hints">
      {missingMin > 0 && (
        <div className="co-hint is-warn" role="status">
          {t('cart.minOrder', { min: price(minOrder), missing: price(missingMin) })}
        </div>
      )}
      <div className={`co-hint ${missingFree === 0 ? 'is-ok' : ''}`}>
        <span>{missingFree === 0 ? t('cart.freeReached') : t('cart.freeFrom', { missing: price(missingFree) })}</span>
        <div className="co-bar" role="progressbar" aria-valuemin={0} aria-valuemax={freeFrom} aria-valuenow={Math.min(subtotal, freeFrom)}>
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function Empty({ title, text, cta }) {
  return (
    <div className="co-empty">
      <div className="co-empty__icon">
        <Icon name="bag" size={44} />
      </div>
      <h1>{title}</h1>
      <p>{text}</p>
      <a className="co-btn co-btn--primary" href={href('/bestellen')}>
        {cta}
      </a>
    </div>
  );
}
