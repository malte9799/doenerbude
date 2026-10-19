import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { brand } from '../brand/brand.js';

// One cart for every entry point (3D store, express shop, Baukasten).
// A line is { key, productId, options, unitPrice, qty }; `key` merges
// identical configurations.

const STORAGE_KEY = 'doenerbude.cart.v1';

const lineKey = (productId, options) => `${productId}|${JSON.stringify(options ?? {})}`;

function reducer(lines, action) {
  switch (action.type) {
    case 'add': {
      const key = lineKey(action.productId, action.options);
      const existing = lines.find(l => l.key === key);
      if (existing) return lines.map(l => (l.key === key ? { ...l, qty: l.qty + (action.qty ?? 1) } : l));
      return [...lines, { key, productId: action.productId, options: action.options ?? {}, unitPrice: action.unitPrice, qty: action.qty ?? 1 }];
    }
    case 'setQty':
      return lines.map(l => (l.key === action.key ? { ...l, qty: action.qty } : l)).filter(l => l.qty > 0);
    case 'remove':
      return lines.filter(l => l.key !== action.key);
    case 'clear':
      return [];
    default:
      return lines;
  }
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* private mode – the cart just won't persist */
    }
  }, [lines]);

  const value = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const { fee, freeFrom, minOrder } = brand.delivery;
    const deliveryFee = subtotal >= freeFrom || subtotal === 0 ? 0 : fee;
    return {
      lines,
      count,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      missingForMin: Math.max(0, minOrder - subtotal),
      add: (productId, unitPrice, options, qty) => dispatch({ type: 'add', productId, unitPrice, options, qty }),
      setQty: (key, qty) => dispatch({ type: 'setQty', key, qty }),
      remove: key => dispatch({ type: 'remove', key }),
      clear: () => dispatch({ type: 'clear' }),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
