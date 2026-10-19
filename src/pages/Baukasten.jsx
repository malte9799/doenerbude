import Layout from '../components/layout/Layout.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useRoute } from '../router.js';

// Stub – replaced by the Baukasten package. Route: #/baukasten/<model>?p=<productId>
export default function Baukasten() {
  const { t } = useI18n();
  const model = useRoute().split('?')[0].split('/')[2];
  return (
    <Layout>
      <h1>Baukasten: {model}</h1>
      <p>{t('common.comingSoon')}</p>
    </Layout>
  );
}
