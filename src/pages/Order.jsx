import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/layout/Layout.jsx';
import ShopHero from '../components/shop/ShopHero.jsx';
import ProductCard from '../components/shop/ProductCard.jsx';
import ProductDialog from '../components/shop/ProductDialog.jsx';
import CartSidebar from '../components/shop/CartSidebar.jsx';
import { IconClose, IconSearch } from '../components/shop/icons.jsx';
import { categories, products } from '../data/menu.js';
import { useI18n } from '../i18n/index.jsx';
import '../components/shop/shop.css';
import './order/order.css';

// Express shop: hero, sticky category bar with scroll-spy and search, product
// list grouped by category, product dialog and a sticky cart column.

const SPY_OFFSET = 150; // header + category bar + a little air

export default function Order() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(null);
  const sections = useRef({});

  const groups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const matches = p => !q || `${t(`products.${p.id}.name`)} ${t(`products.${p.id}.desc`)}`.toLocaleLowerCase().includes(q);
    return categories
      .map(id => ({ id, items: products.filter(p => p.category === id && matches(p)) }))
      .filter(g => g.items.length > 0);
  }, [query, t]);

  const allCategories = useMemo(() => categories.filter(id => products.some(p => p.category === id)), []);

  // Scroll-spy: the last section whose top has passed the sticky bars.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = groups[0]?.id ?? null;
      for (const g of groups) {
        const el = sections.current[g.id];
        if (el && el.getBoundingClientRect().top <= SPY_OFFSET) current = g.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && groups.length) current = groups[groups.length - 1].id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [groups]);

  const jump = useCallback(id => {
    const el = sections.current[id];
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
  }, []);

  const visible = new Set(groups.map(g => g.id));

  return (
    <Layout>
      <ShopHero />

      <div className="shop">
        <div className="shop__main">
          <div className="catbar">
            <nav className="catbar__tabs" aria-label={t('shop.categoriesLabel')}>
              {allCategories.map(id => (
                <button
                  key={id}
                  type="button"
                  className={`catbar__tab ${active === id && visible.has(id) ? 'is-active' : ''}`}
                  aria-current={active === id && visible.has(id) ? 'true' : undefined}
                  disabled={!visible.has(id)}
                  onClick={() => jump(id)}
                >
                  {t(`categories.${id}`)}
                </button>
              ))}
            </nav>
            <label className="catbar__search">
              <IconSearch width={18} height={18} />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('shop.search.placeholder')}
                aria-label={t('shop.search.label')}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label={t('shop.search.clear')}>
                  <IconClose width={16} height={16} />
                </button>
              )}
            </label>
          </div>

          {groups.length === 0 ? (
            <div className="shop__empty">
              <strong>{t('shop.search.empty', { query: query.trim() })}</strong>
              <p>{t('shop.search.emptyHint')}</p>
            </div>
          ) : (
            groups.map(g => (
              <section key={g.id} className="cat" ref={el => (sections.current[g.id] = el)} aria-labelledby={`cat-${g.id}`}>
                <h2 id={`cat-${g.id}`} className="cat__title">
                  {t(`categories.${g.id}`)}
                </h2>
                <div className="cat__grid">
                  {g.items.map(p => (
                    <ProductCard key={p.id} product={p} onOpen={setOpen} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <CartSidebar />
      </div>

      {open && <ProductDialog key={open.id} product={open} onClose={() => setOpen(null)} />}
    </Layout>
  );
}
