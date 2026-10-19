import { brand } from '../brand/brand.js';
import { useI18n } from '../i18n/index.jsx';
import { href } from '../router.js';
import Wordmark from '../brand/Wordmark.jsx';

// Stub – replaced by the landing package (3D scroll journey).
export default function Landing() {
  const { t } = useI18n();
  return (
    <main className="placeholder">
      <Wordmark className="placeholder__logo" />
      <p>{brand.slogan}</p>
      <a className="btn" href={href('/bestellen')}>{t('nav.orderNow')} →</a>
    </main>
  );
}
