import Layout from '../components/layout/Layout.jsx';
import { useI18n } from '../i18n/index.jsx';
import { brand } from '../brand/brand.js';
import { href } from '../router.js';
import { todaysHours } from '../components/checkout/slots.js';
import '../components/checkout/checkout.css';
import './info.css';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Which brand.hours row covers today (same day-range format as slots.js).
const todayIndex = () => {
  const idx = (new Date().getDay() + 6) % 7;
  return brand.hours.findIndex(h => {
    const [from, to = from] = h.days.split(/[–-]/).map(s => DAYS.indexOf(s.trim().slice(0, 2)));
    return from <= to ? idx >= from && idx <= to : idx >= from || idx <= to;
  });
};

export default function Info() {
  const { t, price } = useI18n();
  const { contact, delivery, hours, name, slogan } = brand;
  const today = todaysHours() ? todayIndex() : -1;
  const eta = t('info.etaValue', { from: delivery.etaMinutes[0], to: delivery.etaMinutes[1] });
  const vars = { name, slogan, street: contact.street, city: contact.city, phone: contact.phone };
  const cityName = contact.city.replace(/^\d+\s*/, '');

  return (
    <Layout>
      <div className="co info">
        <div className="co__head info__head">
          <div>
            <h1 className="co__title">{t('info.title')}</h1>
            <p className="info__lead">{t('info.lead')}</p>
          </div>
        </div>

        <div className="info__grid">
          <section className="co-card">
            <h2 className="co-card__title">{t('info.hours')}</h2>
            <ul className="info__hours">
              {hours.map((h, i) => (
                <li key={h.days} className={i === today ? 'is-today' : undefined}>
                  <span>
                    {h.days}
                    {i === today && <em>{t('info.today')}</em>}
                  </span>
                  <strong>{h.time}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="co-card">
            <h2 className="co-card__title">{t('info.visit')}</h2>
            <dl className="info__facts">
              <div>
                <dt>{t('info.address')}</dt>
                <dd>
                  {name}
                  <br />
                  {contact.street}
                  <br />
                  {contact.city}
                </dd>
              </div>
              <div>
                <dt>{t('info.phone')}</dt>
                <dd>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a>
                </dd>
              </div>
            </dl>
          </section>

          <section className="co-card info__wide">
            <h2 className="co-card__title">{t('info.deliveryTitle')}</h2>
            <p className="info__text">{t('info.deliveryText', { city: cityName, eta })}</p>
            <dl className="info__stats">
              <div>
                <dt>{t('info.minOrder')}</dt>
                <dd>{price(delivery.minOrder)}</dd>
              </div>
              <div>
                <dt>{t('info.fee')}</dt>
                <dd>{price(delivery.fee)}</dd>
              </div>
              <div>
                <dt>{t('info.freeFrom')}</dt>
                <dd>{price(delivery.freeFrom)}</dd>
              </div>
              <div>
                <dt>{t('info.eta')}</dt>
                <dd>{eta}</dd>
              </div>
            </dl>
            <p className="info__text info__text--muted">{t('info.pickup')}</p>
          </section>

          <section className="co-card info__wide">
            <h2 className="co-card__title">{t('info.aboutTitle')}</h2>
            {t('info.about').map((p, i) => (
              <p className="info__text" key={i}>
                {p.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')}
              </p>
            ))}
            <a className="co-btn co-btn--primary" style={{ marginTop: 8 }} href={href('/bestellen')}>
              {t('nav.orderNow')}
            </a>
          </section>

          <section className="co-card info__wide">
            <h2 className="co-card__title">{t('info.legal')}</h2>
            <div className="info__legal">
              <article>
                <h3>{t('info.imprint')}</h3>
                <p>{t('info.imprintText', vars)}</p>
                <small>{t('info.imprintNote')}</small>
              </article>
              <article>
                <h3>{t('info.privacy')}</h3>
                <p>{t('info.privacyText', vars)}</p>
                <small>{t('info.privacyNote')}</small>
              </article>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
