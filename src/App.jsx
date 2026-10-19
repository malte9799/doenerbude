import { lazy, Suspense } from 'react';
import { useRoute } from './router.js';
import Landing from './pages/Landing.jsx';
import Order from './pages/Order.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Info from './pages/Info.jsx';
import Baukasten from './pages/Baukasten.jsx';
import ProductPanel from './components/product/ProductPanel.jsx';

const Studio = lazy(() => import('./pages/Studio.jsx'));

// Hash routes. Packages replace the page files, not this table.
const routes = {
  '/': Landing,
  '/bestellen': Order,
  '/warenkorb': Cart,
  '/kasse': Checkout,
  '/info': Info,
  '/studio': Studio,
};
// Prefix routes: '/baukasten/doener', '/baukasten/pizza', …
const prefixRoutes = [['/baukasten/', Baukasten]];

export default function App() {
  const path = useRoute().split('?')[0];
  const Page = routes[path] ?? prefixRoutes.find(([prefix]) => path.startsWith(prefix))?.[1] ?? Landing;
  return (
    <Suspense fallback={null}>
      <Page />
      <ProductPanel />
    </Suspense>
  );
}
