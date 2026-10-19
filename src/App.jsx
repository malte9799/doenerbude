import { lazy, Suspense } from 'react';
import { useRoute } from './router.js';
import Placeholder from './pages/Placeholder.jsx';
import Order from './pages/Order.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Info from './pages/Info.jsx';

const Studio = lazy(() => import('./pages/Studio.jsx'));

// Hash routes. Packages replace the page files, not this table.
const routes = {
  '/bestellen': Order,
  '/warenkorb': Cart,
  '/kasse': Checkout,
  '/info': Info,
  '/studio': Studio,
};

export default function App() {
  const path = useRoute().split('?')[0];
  // The single-file review build opens straight into the studio.
  const Page = routes[path] ?? (import.meta.env.MODE === 'single' ? Studio : Placeholder);
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}
