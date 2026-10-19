import { useI18n } from '../../i18n/index.jsx';

// Readable one-line summary of a cart line's options. Unknown keys and values
// degrade to their raw id instead of breaking.
export function useDescribeOptions() {
  const { t } = useI18n();
  const known = (ns, id) => {
    const key = `${ns}.${id}`;
    const v = t(key);
    return typeof v === 'string' && v !== key ? v : null;
  };
  const labelOf = (id, ns) => known(ns, id) ?? known('ingredients', id) ?? known('products', `${id}.name`) ?? String(id);
  const valueText = (key, v) => {
    if (Array.isArray(v)) return v.map(x => labelOf(x, key === 'size' ? 'cart.sizes' : 'ingredients')).join(', ');
    if (typeof v === 'boolean') return t(v ? 'cart.options.yes' : 'cart.options.no');
    if (v && typeof v === 'object') return '';
    return labelOf(v, key === 'size' ? 'cart.sizes' : 'ingredients');
  };
  return options => {
    const parts = [];
    for (const [key, v] of Object.entries(options ?? {})) {
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
      const text = valueText(key, v);
      if (!text) continue;
      const label = known('cart.options', key) ?? key;
      parts.push({ label, text });
    }
    return parts;
  };
}

export function useLineName() {
  const { t } = useI18n();
  return line => {
    const key = `products.${line.productId}.name`;
    const v = t(key);
    return v === key ? line.productId : v;
  };
}

export function OptionList({ options, className = 'lines__options' }) {
  const describe = useDescribeOptions();
  const parts = describe(options);
  if (!parts.length) return null;
  return (
    <ul className={className}>
      {parts.map(p => (
        <li key={p.label}>
          <span>{p.label}:</span> {p.text}
        </li>
      ))}
    </ul>
  );
}
