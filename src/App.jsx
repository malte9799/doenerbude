import { lazy, Suspense } from 'react';
import { useRoute } from './router.js';
import Placeholder from './pages/Placeholder.jsx';

const Studio = lazy(() => import('./pages/Studio.jsx'));

export default function App() {
  const path = useRoute();
  let page;
  // The single-file review build opens straight into the studio.
  if (path.startsWith('/studio') || import.meta.env.MODE === 'single') page = <Studio />;
  else page = <Placeholder />;
  return <Suspense fallback={null}>{page}</Suspense>;
}
