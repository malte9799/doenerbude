import { brand } from '../brand/brand.js';
import { useI18n } from '../i18n/index.jsx';
import { href } from '../router.js';
import Wordmark from '../brand/Wordmark.jsx';

export default function Placeholder() {
  const { t } = useI18n();
  return (
    <main className="placeholder">
      <Wordmark className="placeholder__logo" />
      <p>{brand.slogan}</p>
      <p className="placeholder__soon">{t('common.comingSoon')}</p>
      <a className="btn" href={href('/studio')}>{t('studio.title')} →</a>
    </main>
  );
}
