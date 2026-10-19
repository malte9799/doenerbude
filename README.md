# DönerBude

Konzept-Shop für einen Döner- und Pizzaladen: 3D-Landing (Scroll-Reise durch den Laden), Express-Shop im Lieferando-Stil und ein Baukasten für Döner und Pizza. Das Konzept steht in [CONCEPT.md](CONCEPT.md).

## Stand

Phase 0 und Qualitätstest: Gerüst, Marke, i18n, Speisekarte, Warenkorb, prozedurale Textur-Engine und die ersten zwei Modelle (Döner, Pizza) im Studio (`#/studio`). Renders liegen in `docs/qualitaetstest/`.

## Befehle

```bash
npm install
npm run build                  # dist/
npx vite build --mode single   # dist-single/index.html – alles in einer Datei, öffnet ohne Server
```

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/brand/` | alles Markenspezifische (Name, Farben, Schriften, Adresse, Liefergebühren) |
| `src/i18n/` | Texte (`de.js`), weitere Sprachen als Geschwisterdateien |
| `src/data/menu.js` | Speisekarte |
| `src/state/cart.jsx` | gemeinsamer Warenkorb |
| `src/three/tex/` | Rauschen, Textur-Backen im Web Worker |
| `src/three/materials/` | Textur-Rezepte und die gemeinsame Material-Bibliothek |
| `src/three/geo.js` | Geometrie-Helfer (weiche Formen, Schichten, Bänder) |
| `src/three/products/` | Modelle; jedes erfüllt die Schnittstelle aus CONCEPT.md §6 |
| `src/three/studio/` | gemeinsames Studio-Licht |
