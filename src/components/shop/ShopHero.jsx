import { brand } from '../../brand/brand.js';
import { useI18n } from '../../i18n/index.jsx';
import Wordmark from '../../brand/Wordmark.jsx';
import { IconClock, IconStar } from './icons.jsx';

// Banner with a warm, illustration-like background (gradient + soft shapes).
// A rendered 3D shop can replace `.shop-hero__art` later.
export default function ShopHero() {
  const { t, price } = useI18n();
  const d = brand.delivery;
  const facts = [
    [t('shop.hero.minOrder'), price(d.minOrder)],
    [t('shop.hero.fee'), price(d.fee)],
    [t('shop.hero.freeFrom'), price(d.freeFrom)],
    [t('shop.hero.eta'), t('shop.header.eta', { min: d.etaMinutes[0], max: d.etaMinutes[1] })],
  ];
  return (
    <section className="shop-hero">
      <div className="shop-hero__banner">
        <div className="shop-hero__art" aria-hidden="true">
          <span className="blob blob--1" />
          <span className="blob blob--2" />
          <span className="blob blob--3" />
          <span className="blob blob--4" />
          <span className="blob blob--5" />
        </div>
        <div className="shop-hero__title">
          <h1>
            <Wordmark />
          </h1>
          <p>{brand.slogan}</p>
        </div>
      </div>

      <div className="shop-hero__card">
        <div className="shop-hero__rating" aria-label={t('shop.hero.ratingLabel', { rating: t('shop.hero.rating') })}>
          <span className="shop-hero__score">
            <IconStar size={18} /> {t('shop.hero.rating')}
          </span>
          <span className="shop-hero__reviews">{t('shop.hero.reviews')}</span>
        </div>

        <dl className="shop-hero__facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="shop-hero__hours">
          <span className="shop-hero__hours-title">
            <IconClock width={16} height={16} /> {t('shop.hero.hours')}
          </span>
          <ul>
            {brand.hours.map(h => (
              <li key={h.days}>
                <span>{h.days}</span> {h.time}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
