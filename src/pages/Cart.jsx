import Layout from '../components/layout/Layout.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useCart } from '../state/cart.jsx';
import { href } from '../router.js';
import { OptionList, useLineName } from '../components/checkout/lines.jsx';
import { DeliveryHints, Empty, Icon, Totals } from '../components/checkout/parts.jsx';
import '../components/checkout/checkout.css';
import { useDelivery } from '../components/shop/useDelivery.js';

export default function Cart() {
  const { t, price } = useI18n();
  const cart = useCart();
  const lineName = useLineName();
  const { mode } = useDelivery();
  const pickup = mode === 'pickup';
  const { lines, count, subtotal, missingForMin } = cart;
  const deliveryFee = pickup ? 0 : cart.deliveryFee;
  const total = subtotal + deliveryFee;

  if (!lines.length) {
    return (
      <Layout>
        <div className="co">
          <Empty title={t('cart.emptyTitle')} text={t('cart.emptyText')} cta={t('cart.emptyCta')} />
        </div>
      </Layout>
    );
  }

  const blocked = !pickup && missingForMin > 0;

  return (
    <Layout>
      <div className="co">
        <div className="co__head">
          <h1 className="co__title">{t('cart.title')}</h1>
          <span className="co__sub">{t('cart.items', { count })}</span>
        </div>

        <div className="co__grid">
          <section className="co-card" aria-label={t('cart.title')}>
            <ul className="lines">
              {lines.map(line => (
                <li className="lines__item" key={line.key}>
                  <div>
                    <div className="lines__name">{lineName(line)}</div>
                    <OptionList options={line.options} />
                    {line.qty > 1 && <div className="lines__each">{t('cart.each', { price: price(line.unitPrice) })}</div>}
                  </div>
                  <div className="qty" role="group" aria-label={t('cart.qty')}>
                    <button type="button" aria-label={t('cart.dec')} onClick={() => cart.setQty(line.key, line.qty - 1)}>
                      −
                    </button>
                    <output aria-live="polite">{line.qty}</output>
                    <button type="button" aria-label={t('cart.inc')} onClick={() => cart.setQty(line.key, line.qty + 1)}>
                      +
                    </button>
                  </div>
                  <div className="lines__price">{price(line.unitPrice * line.qty)}</div>
                  <button type="button" className="lines__remove" aria-label={t('cart.remove')} title={t('cart.remove')} onClick={() => cart.remove(line.key)}>
                    <Icon name="trash" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="co-actions">
              <a className="co-btn co-btn--ghost" href={href('/bestellen')}>
                ← {t('cart.continue')}
              </a>
              <button type="button" className="co-link" onClick={() => cart.clear()}>
                {t('cart.clear')}
              </button>
            </div>
          </section>

          <aside className="co-card co-sum">
            <DeliveryHints subtotal={subtotal} />
            <Totals subtotal={subtotal} fee={deliveryFee} total={total} />
            <a
              className="co-btn co-btn--primary co-btn--block"
              style={{ marginTop: 20 }}
              href={blocked ? undefined : href('/kasse')}
              aria-disabled={blocked || undefined}
              tabIndex={blocked ? -1 : undefined}
            >
              {t('cart.checkout')}
            </a>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
