import { closeProduct, useSelectedProduct } from '../../state/selection.js';
import { useI18n } from '../../i18n/index.jsx';

// Stub – replaced by its work package. Mounted once in App, opens whenever a
// product is selected via openProduct(id).
export default function ProductPanel() {
  const { t } = useI18n();
  const id = useSelectedProduct();
  if (!id) return null;
  return (
    <aside style={{ position: 'fixed', right: 24, top: 24, padding: 24, background: '#fff', borderRadius: 16 }}>
      <strong>{t(`products.${id}.name`)}</strong>
      <button onClick={closeProduct}>×</button>
    </aside>
  );
}
