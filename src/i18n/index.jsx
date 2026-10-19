import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import de from './de.js';
import { brand } from '../brand/brand.js';

const dictionaries = { de };

const I18nContext = createContext(null);

const lookup = (dict, key) => key.split('.').reduce((node, part) => node?.[part], dict);

export function I18nProvider({ children, initial = 'de' }) {
  const [lang, setLang] = useState(initial);

  const t = useCallback(
    (key, vars) => {
      const value = lookup(dictionaries[lang], key) ?? lookup(dictionaries.de, key) ?? key;
      if (!vars || typeof value !== 'string') return value;
      return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
    },
    [lang],
  );

  const price = useMemo(() => {
    const fmt = new Intl.NumberFormat(brand.locale, { style: 'currency', currency: brand.currency });
    return value => fmt.format(value);
  }, []);

  const value = useMemo(() => ({ lang, setLang, t, price, languages: Object.keys(dictionaries) }), [lang, t, price]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
