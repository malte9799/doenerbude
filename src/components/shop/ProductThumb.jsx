import { useEffect, useState } from 'react';
import { cachedThumb, getThumb, lookupModel, thumbKey } from './thumbRenderer.js';
import { baseLayers } from '../../pages/order/options.js';
import { CategoryGlyph } from './icons.jsx';
import './shop.css';

// Image of a product, rendered once from its 3D model (see thumbRenderer).
// Products without a model (or whose render failed) show a brand-coloured tile.

export function ThumbPlaceholder({ product, name }) {
  return (
    <div className={`thumb thumb--ph thumb--${product.category}`} role="img" aria-label={name}>
      <span className="thumb__glyph">
        <CategoryGlyph category={product.category} />
      </span>
      <span className="thumb__initial" aria-hidden="true">
        {name.charAt(0)}
      </span>
    </div>
  );
}

export default function ProductThumb({ product, name, layers }) {
  const model = lookupModel(product);
  const active = layers ?? (model ? baseLayers(product) : []);
  const baked = Boolean(model?.bakeable);
  const key = model ? thumbKey(model.id, active, baked) : null;
  const [url, setUrl] = useState(() => (key ? cachedThumb(key) : null));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!model) return undefined;
    let live = true;
    const hit = cachedThumb(key);
    if (hit) {
      setUrl(hit);
      return undefined;
    }
    getThumb(model.id, active, baked)
      .then(u => {
        if (!live) return;
        setUrl(u);
        setFailed(false);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!model || failed) return <ThumbPlaceholder product={product} name={name} />;
  return (
    <div className={`thumb thumb--model ${url ? 'is-ready' : 'is-pending'}`}>
      {url ? <img src={url} alt={name} draggable="false" /> : <span className="thumb__spinner" aria-hidden="true" />}
    </div>
  );
}
