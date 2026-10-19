import Layout from '../components/layout/Layout.jsx';
import { useI18n } from '../i18n/index.jsx';

// Stub – replaced by its work package.
export default function Cart() {
  const { t } = useI18n();
  return (
    <Layout>
      <h1>Cart</h1>
      <p>{t('common.comingSoon')}</p>
    </Layout>
  );
}
