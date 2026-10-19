import { brand } from '../../brand/brand.js';
import { useI18n } from '../../i18n/index.jsx';
import { useCart } from '../../state/cart.jsx';
import { href } from '../../router.js';
import { useDelivery } from './useDelivery.js';
import { IconBag, IconMinus, IconPlus, IconTrash } from './icons.jsx';
import { optionSummary } from '../../pages/order/options.js';

export default function CartSidebar() {
  const { t, price } = useI18n();
  const cart = useCart();
  const { mode } = useDelivery();
  const { minOrder, freeFrom, fee } = brand.delivery;
  const delivery = mode === 'delivery';

  const { lines, subtotal } = cart;
  const deliveryFee = delivery && subtotal > 0 && subtotal < freeFrom ? fee : 0;
  const total = subtotal + deliveryFee;
  const belowMin = delivery && subtotal < minOrder;

  // Progress: first to the minimum order, then to free delivery.
  let progress = null;
  if (delivery && lines.length) {
    if (subtotal < minOrder) progress = { value: subtotal / minOrder, text: t('shop.cart.missingMin', { amount: price(minOrder - subtotal) }), tone: 'min' };
    else if (subtotal < freeFrom) progress = { value: (subtotal - minOrder) / (freeFrom - minOrder), text: t('shop.cart.missingFree', { amount: price(freeFrom - subtotal) }), tone: 'free' };
    else progress = { value: 1, text: t('shop.cart.freeReached'), tone: 'done' };
  }

  return (
    <aside className="cside" aria-label={t('shop.cart.title')}>
      <div className="cside__card">
        <header className="cside__head">
          <h2>{t('shop.cart.title')}</h2>
          {cart.count > 0 && <span className="cside__badge">{cart.count}</span>}
        </header>

        {lines.length === 0 ? (
          <div className="cside__empty">
            <span className="cside__empty-icon">
              <IconBag width={30} height={30} />
            </span>
            <strong>{t('shop.cart.empty')}</strong>
            <p>{t('shop.cart.emptyHint')}</p>
          </div>
        ) : (
          <ul className="cside__lines">
            {lines.map(l => {
              const name = t(`products.${l.productId}.name`);
              const summary = optionSummary(t, l.options);
              return (
                <li key={l.key} className="cline">
                  <div className="cline__info">
                    <span className="cline__name">{name}</span>
                    {summary && <span className="cline__opts">{summary}</span>}
                    <div className="cline__qty">
                      <button type="button" onClick={() => cart.setQty(l.key, l.qty - 1)} aria-label={l.qty === 1 ? t('shop.cart.remove', { name }) : t('shop.cart.decrease', { name })}>
                        {l.qty === 1 ? <IconTrash width={15} height={15} /> : <IconMinus width={15} height={15} />}
                      </button>
                      <output>{l.qty}</output>
                      <button type="button" onClick={() => cart.setQty(l.key, l.qty + 1)} aria-label={t('shop.cart.increase', { name })}>
                        <IconPlus width={15} height={15} />
                      </button>
                    </div>
                  </div>
                  <span className="cline__price">{price(l.unitPrice * l.qty)}</span>
                </li>
              );
            })}
          </ul>
        )}

        {progress && (
          <div className={`cside__progress cside__progress--${progress.tone}`}>
            <p>{progress.text}</p>
            <div className="cside__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.value * 100)}>
              <span style={{ width: `${Math.round(progress.value * 100)}%` }} />
            </div>
          </div>
        )}

        {lines.length > 0 && (
          <dl className="cside__sums">
            <div>
              <dt>{t('shop.cart.subtotal')}</dt>
              <dd>{price(subtotal)}</dd>
            </div>
            <div>
              <dt>{t(delivery ? 'shop.cart.deliveryFee' : 'shop.cart.pickupFee')}</dt>
              <dd>{deliveryFee === 0 ? t('shop.cart.free') : price(deliveryFee)}</dd>
            </div>
            <div className="cside__total">
              <dt>{t('shop.cart.total')}</dt>
              <dd>{price(total)}</dd>
            </div>
          </dl>
        )}

        <div className="cside__actions">
          <a
            className={`shop-btn shop-btn--primary ${lines.length === 0 || belowMin ? 'is-disabled' : ''}`}
            href={lines.length === 0 || belowMin ? undefined : href('/kasse')}
            aria-disabled={lines.length === 0 || belowMin}
          >
            {belowMin && lines.length > 0 ? t('shop.cart.minHint', { amount: price(minOrder) }) : t('shop.cart.checkout')}
          </a>
          <a className="shop-btn shop-btn--ghost" href={href('/warenkorb')}>
            {t('shop.cart.viewCart')}
          </a>
        </div>
      </div>
    </aside>
  );
}
