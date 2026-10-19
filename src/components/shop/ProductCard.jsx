import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useCart } from '../../state/cart.jsx';
import ProductThumb from './ProductThumb.jsx';
import { IconCheck, IconPlus } from './icons.jsx';
import { hasChoices } from '../../pages/order/options.js';

export default function ProductCard({ product, onOpen }) {
  const { t, price } = useI18n();
  const cart = useCart();
  const [flash, setFlash] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const name = t(`products.${product.id}.name`);
  const choices = hasChoices(product);

  const add = e => {
    e.stopPropagation();
    if (choices) return onOpen(product);
    cart.add(product.id, product.price, {}, 1);
    setFlash(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(false), 1200);
    return undefined;
  };

  return (
    <article className="pcard" onClick={() => onOpen(product)}>
      <div className="pcard__text">
        <h3 className="pcard__name">
          <button type="button" className="pcard__open" onClick={() => onOpen(product)}>
            {name}
          </button>
        </h3>
        <p className="pcard__desc">{t(`products.${product.id}.desc`)}</p>
        <p className="pcard__price">{price(product.price)}</p>
      </div>
      <div className="pcard__media">
        <ProductThumb product={product} name={name} />
        <button
          type="button"
          className={`pcard__add ${flash ? 'is-flash' : ''}`}
          onClick={add}
          aria-label={t(choices ? 'shop.card.choose' : 'shop.card.add', { name })}
        >
          {flash ? <IconCheck /> : <IconPlus />}
        </button>
      </div>
    </article>
  );
}
