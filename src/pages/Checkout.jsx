import Layout from '../components/layout/Layout.jsx';
import { useI18n } from '../i18n/index.jsx';

// Stub – replaced by its work package.
export default function Checkout() {
  const { t } = useI18n();
  return (
    <Layout>
      <h1>Checkout</h1>
      <p>{t('common.comingSoon')}</p>
    </Layout>
  );
}
