import { useMemo, useState } from 'react';
import Layout from '../components/layout/Layout.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useCart } from '../state/cart.jsx';
import { brand } from '../brand/brand.js';
import { href } from '../router.js';
import { OptionList, useLineName } from '../components/checkout/lines.jsx';
import { Empty, Icon, Totals } from '../components/checkout/parts.jsx';
import { hhmm, timeSlots } from '../components/checkout/slots.js';
import '../components/checkout/checkout.css';
import '../components/checkout/form.css';
import { useDelivery } from '../components/shop/useDelivery.js';

const emptyForm = { name: '', street: '', zip: '', city: '', phone: '', note: '' };

const validate = (form, mode) => {
  const e = {};
  if (form.name.trim().length < 2) e.name = 'name';
  if (form.phone.replace(/\D/g, '').length < 6) e.phone = 'phone';
  if (mode === 'delivery') {
    if (!/\p{L}/u.test(form.street) || !/\d/.test(form.street)) e.street = 'street';
    if (!/^\d{5}$/.test(form.zip.trim())) e.zip = 'zip';
    if (form.city.trim().length < 2) e.city = 'city';
  }
  return e;
};

const orderNumber = () => `${10000 + Math.floor(Math.random() * 89999)}`;

function Field({ id, label, optional, error, className = '', children }) {
  const { t } = useI18n();
  return (
    <div className={`co-field ${className} ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {label} {optional && <em>({t('checkout.optional')})</em>}
      </label>
      {children}
      {error && (
        <span className="co-error" id={`${id}-err`}>
          <Icon name="alert" size={15} /> {t(`checkout.errors.${error}`)}
        </span>
      )}
    </div>
  );
}

function Choice({ name, value, checked, onChange, icon, label, hint }) {
  return (
    <label className="co-seg__item">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      {icon && (
        <span className="co-seg__icon">
          <Icon name={icon} size={20} />
        </span>
      )}
      <span className="co-seg__label">{label}</span>
      {hint && <span className="co-seg__hint">{hint}</span>}
    </label>
  );
}

export default function Checkout() {
  const { t, price } = useI18n();
  const cart = useCart();
  const lineName = useLineName();
  const { lines, subtotal, deliveryFee, missingForMin } = cart;
  const { etaMinutes } = brand.delivery;
  const eta = t('checkout.minutes', { from: etaMinutes[0], to: etaMinutes[1] });

  // Shared with the shop header's Lieferung/Abholung toggle.
  const { mode, setMode } = useDelivery();
  const [form, setForm] = useState(emptyForm);
  const [timeMode, setTimeMode] = useState('asap');
  const [slot, setSlot] = useState('');
  const [payment, setPayment] = useState('cash');
  const [errors, setErrors] = useState({});
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(null);

  const slots = useMemo(() => timeSlots(), []);
  const delivery = mode === 'delivery';
  const fee = delivery ? deliveryFee : 0;
  const total = subtotal + fee;
  const belowMin = delivery && missingForMin > 0;

  const set = key => e => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    if (tried) setErrors(prev => ({ ...prev, ...pickErrors(next, mode, timeMode, slot) }));
  };
  const pickErrors = (f, m, tm, s) => {
    const e = validate(f, m);
    if (tm === 'scheduled' && !s) e.slot = 'slot';
    return e;
  };

  const submit = ev => {
    ev.preventDefault();
    setTried(true);
    const e = pickErrors(form, mode, timeMode, slot);
    setErrors(e);
    if (Object.keys(e).length || belowMin) {
      requestAnimationFrame(() => document.querySelector('.has-error input, .has-error select')?.focus());
      return;
    }
    const now = new Date();
    const etaDate = new Date(now.getTime() + etaMinutes[1] * 60000);
    setDone({
      number: orderNumber(),
      mode,
      form,
      lines,
      subtotal,
      fee,
      total,
      payment,
      when: timeMode === 'scheduled' ? slot : null,
      etaClock: hhmm(etaDate.getHours() * 60 + etaDate.getMinutes()),
    });
    cart.clear();
    window.scrollTo?.(0, 0);
  };

  const revalidate = patch => {
    if (!tried) return;
    const m = patch.mode ?? mode;
    const tm = patch.timeMode ?? timeMode;
    const s = patch.slot ?? slot;
    setErrors(pickErrors(form, m, tm, s));
  };

  if (done) return <Layout><Confirmation order={done} /></Layout>;

  if (!lines.length) {
    return (
      <Layout>
        <div className="co">
          <Empty title={t('checkout.emptyTitle')} text={t('checkout.emptyText')} cta={t('checkout.emptyCta')} />
        </div>
      </Layout>
    );
  }

  const payOptions = delivery
    ? [
        ['cash', t('checkout.pay.cash'), t('checkout.pay.cashHint')],
        ['card', t('checkout.pay.card'), t('checkout.pay.cardHint')],
        ['online', t('checkout.pay.online'), t('checkout.pay.onlineHint')],
      ]
    : [
        ['cash', t('checkout.pay.cashPickup'), t('checkout.pay.cashPickupHint')],
        ['card', t('checkout.pay.cardPickup'), t('checkout.pay.cardPickupHint')],
        ['online', t('checkout.pay.online'), t('checkout.pay.onlineHint')],
      ];

  return (
    <Layout>
      <div className="co">
        <div className="co__head">
          <h1 className="co__title">{t('checkout.title')}</h1>
        </div>
        <div className="co-demo" role="note">
          <span className="co-demo__badge">{t('checkout.demoBadge')}</span>
          {t('checkout.demoNotice')}
        </div>

        <form className="co__grid" onSubmit={submit} noValidate>
          <div className="co__stack">
            <section className="co-card">
              <h2 className="co-card__title">{t('checkout.mode')}</h2>
              <fieldset className="co-seg co-seg--2">
                <legend hidden>{t('checkout.mode')}</legend>
                <Choice name="mode" value="delivery" checked={delivery} onChange={v => { setMode(v); revalidate({ mode: v }); }} icon="bike" label={t('checkout.delivery')} hint={t('checkout.deliveryHint', { eta })} />
                <Choice name="mode" value="pickup" checked={!delivery} onChange={v => { setMode(v); revalidate({ mode: v }); }} icon="store" label={t('checkout.pickup')} hint={t('checkout.pickupHint', { eta })} />
              </fieldset>
            </section>

            <section className="co-card">
              <h2 className="co-card__title">{delivery ? t('checkout.address') : t('checkout.contact')}</h2>
              <div className="co-fields">
                <Field id="f-name" label={t('checkout.name')} error={errors.name} className="co-field--half">
                  <input id="f-name" autoComplete="name" placeholder={t('checkout.namePh')} value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
                </Field>
                <Field id="f-phone" label={t('checkout.phone')} error={errors.phone} className="co-field--half">
                  <input id="f-phone" type="tel" autoComplete="tel" placeholder={t('checkout.phonePh')} value={form.phone} onChange={set('phone')} aria-invalid={!!errors.phone} />
                </Field>
                {delivery ? (
                  <>
                    <Field id="f-street" label={t('checkout.street')} error={errors.street}>
                      <input id="f-street" autoComplete="street-address" placeholder={t('checkout.streetPh')} value={form.street} onChange={set('street')} aria-invalid={!!errors.street} />
                    </Field>
                    <Field id="f-zip" label={t('checkout.zip')} error={errors.zip} className="co-field--zip">
                      <input id="f-zip" inputMode="numeric" maxLength={5} autoComplete="postal-code" value={form.zip} onChange={set('zip')} aria-invalid={!!errors.zip} />
                    </Field>
                    <Field id="f-city" label={t('checkout.city')} error={errors.city} className="co-field--city">
                      <input id="f-city" autoComplete="address-level2" value={form.city} onChange={set('city')} aria-invalid={!!errors.city} />
                    </Field>
                    <Field id="f-note" label={t('checkout.note')} optional>
                      <textarea id="f-note" placeholder={t('checkout.notePh')} value={form.note} onChange={set('note')} />
                    </Field>
                  </>
                ) : (
                  <p className="co-note" style={{ gridColumn: 'span 6', margin: 0 }}>
                    {t('checkout.pickupAt')}: <strong>{brand.name}</strong>, {brand.contact.street}, {brand.contact.city}
                  </p>
                )}
              </div>
            </section>

            <section className="co-card">
              <h2 className="co-card__title">{t('checkout.time')}</h2>
              <fieldset className="co-seg co-seg--2">
                <legend hidden>{t('checkout.time')}</legend>
                <Choice name="time" value="asap" checked={timeMode === 'asap'} onChange={v => { setTimeMode(v); revalidate({ timeMode: v }); }} icon="clock" label={t('checkout.asap')} hint={t('checkout.asapHint', { eta })} />
                <Choice name="time" value="scheduled" checked={timeMode === 'scheduled'} onChange={v => { setTimeMode(v); revalidate({ timeMode: v }); }} icon="clock" label={t('checkout.scheduled')} hint={t('checkout.scheduledHint')} />
              </fieldset>
              {timeMode === 'scheduled' &&
                (slots.length ? (
                  <Field id="f-slot" label={t('checkout.slotLabel')} error={errors.slot} className="co-slot">
                    <select id="f-slot" value={slot} onChange={e => { setSlot(e.target.value); revalidate({ slot: e.target.value }); }} aria-invalid={!!errors.slot}>
                      <option value="">{t('checkout.slotPlaceholder')}</option>
                      {slots.map(s => (
                        <option key={s.value} value={s.value}>
                          {s.value}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <p className="co-note">{t('checkout.noSlots')}</p>
                ))}
            </section>

            <section className="co-card">
              <h2 className="co-card__title">{t('checkout.payment')}</h2>
              <fieldset className="co-seg co-seg--3 co-seg--plain">
                <legend hidden>{t('checkout.payment')}</legend>
                {payOptions.map(([value, label, hint]) => (
                  <Choice key={value} name="payment" value={value} checked={payment === value} onChange={setPayment} label={label} hint={hint} />
                ))}
              </fieldset>
            </section>
          </div>

          <aside className="co-card co-sum">
            <h2 className="co-card__title">
              {t('checkout.summary')}
              <small>
                <a href={href('/warenkorb')}>{t('checkout.edit')}</a>
              </small>
            </h2>
            <ul className="lines lines--compact">
              {lines.map(line => (
                <li className="lines__item" key={line.key}>
                  <span className="lines__qty">{line.qty}×</span>
                  <div>
                    <div className="lines__name">{lineName(line)}</div>
                    <OptionList options={line.options} />
                  </div>
                  <span className="lines__price">{price(line.unitPrice * line.qty)}</span>
                </li>
              ))}
            </ul>
            <div style={{ borderTop: '1px solid var(--c-line)', paddingTop: 16, marginTop: 8 }}>
              <Totals subtotal={subtotal} fee={fee} total={total} />
            </div>
            {belowMin && tried && (
              <div className="co-alert" role="alert" style={{ marginTop: 16, marginBottom: 0 }}>
                <Icon name="alert" size={18} /> {t('checkout.errors.minOrder', { missing: price(missingForMin) })}
              </div>
            )}
            {tried && Object.keys(errors).length > 0 && (
              <div className="co-alert" role="alert" style={{ marginTop: 16, marginBottom: 0 }}>
                <Icon name="alert" size={18} /> {t('checkout.errors.summary')}
              </div>
            )}
            <button type="submit" className="co-btn co-btn--primary co-btn--block" style={{ marginTop: 20 }}>
              {t('checkout.place')}
            </button>
            <a className="co-btn co-btn--ghost co-btn--block" style={{ marginTop: 10 }} href={href('/warenkorb')}>
              {t('checkout.back')}
            </a>
          </aside>
        </form>
      </div>
    </Layout>
  );
}

function Confirmation({ order }) {
  const { t, price } = useI18n();
  const lineName = useLineName();
  const { form, mode, lines } = order;
  const delivery = mode === 'delivery';
  const { etaMinutes } = brand.delivery;
  const payKey = { cash: delivery ? 'cash' : 'cashPickup', card: delivery ? 'card' : 'cardPickup', online: 'online' }[order.payment];
  const etaRange = t('checkout.minutes', { from: etaMinutes[0], to: etaMinutes[1] });
  return (
    <div className="co">
      <div className="done">
        <div className="done__hero">
          <div className="done__check">
            <Icon name="check" size={44} />
          </div>
          <h1>{t('checkout.done.title', { name: form.name.trim().split(/\s+/)[0] })}</h1>
          <p>{delivery ? t('checkout.done.subtitleDelivery') : t('checkout.done.subtitlePickup')}</p>
        </div>

        <dl className="done__facts">
          <div className="done__fact">
            <dt>{t('checkout.done.number')}</dt>
            <dd>#{order.number}</dd>
          </div>
          <div className="done__fact">
            <dt>{t('checkout.done.eta')}</dt>
            <dd>
              {order.when ? t('checkout.done.etaAt', { time: order.when }) : etaRange}
              {!order.when && <small>{t('checkout.done.etaAt', { time: order.etaClock })}</small>}
            </dd>
          </div>
          <div className="done__fact">
            <dt>{t('checkout.done.payment')}</dt>
            <dd>{t(`checkout.pay.${payKey}`)}</dd>
          </div>
        </dl>

        <div className="done__cols">
          <section className="co-card">
            <h2 className="co-card__title">{t('checkout.done.summary')}</h2>
            <ul className="lines lines--compact">
              {lines.map(line => (
                <li className="lines__item" key={line.key}>
                  <span className="lines__qty">{line.qty}×</span>
                  <div>
                    <div className="lines__name">{lineName(line)}</div>
                    <OptionList options={line.options} />
                  </div>
                  <span className="lines__price">{price(line.unitPrice * line.qty)}</span>
                </li>
              ))}
            </ul>
            <div style={{ borderTop: '1px solid var(--c-line)', paddingTop: 16, marginTop: 8 }}>
              <Totals subtotal={order.subtotal} fee={order.fee} total={order.total} />
            </div>
          </section>
          <section className="co-card">
            <h2 className="co-card__title">{delivery ? t('checkout.done.deliveredTo') : t('checkout.done.pickedUp')}</h2>
            <address className="done__addr">
              {delivery ? (
                <>
                  <strong>{form.name}</strong>
                  <br />
                  {form.street}
                  <br />
                  {form.zip} {form.city}
                  <br />
                  {form.phone}
                  {form.note.trim() && (
                    <>
                      <br />
                      <em>{form.note}</em>
                    </>
                  )}
                </>
              ) : (
                <>
                  <strong>{brand.name}</strong>
                  <br />
                  {brand.contact.street}
                  <br />
                  {brand.contact.city}
                </>
              )}
            </address>
          </section>
        </div>

        <p className="co-demo-line">{t('checkout.done.demo')}</p>
        <div className="done__cta">
          <a className="co-btn co-btn--primary" href={href('/bestellen')}>
            {t('checkout.done.again')}
          </a>
          <a className="co-btn co-btn--ghost" href={href('/')}>
            {t('checkout.done.home')}
          </a>
        </div>
      </div>
    </div>
  );
}
