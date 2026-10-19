import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout.jsx';
import { useRoute } from '../router.js';
import { models } from '../three/products/index.js';
import { TEXTURE_KEYS } from '../three/materials/index.js';
import { loadTextures } from '../three/tex/textures.js';
import Configurator from '../baukasten/Configurator.jsx';
import { TAB_MODELS, resolveProduct } from '../baukasten/product.js';
import '../baukasten/baukasten.css';

// Configurator: #/baukasten/<model>?p=<menu id>
export default function Baukasten() {
  const route = useRoute();
  const [path, query = ''] = route.split('?');
  const requested = path.split('/')[2];
  const model = TAB_MODELS.includes(requested) || models[requested]?.layers ? requested : 'doener';
  const productId = new URLSearchParams(query).get('p');
  const product = useMemo(() => resolveProduct(model, productId), [model, productId]);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    loadTextures(TEXTURE_KEYS, setProgress).then(() => setReady(true), setError);
  }, []);

  return (
    <Layout>
      <Configurator key={`${model}|${product.id}`} model={model} product={product} ready={ready} progress={progress} error={error} />
    </Layout>
  );
}
