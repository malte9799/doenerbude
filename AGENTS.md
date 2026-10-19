# Arbeitsregeln für Agenten

Lies zuerst `CONCEPT.md` (Konzept und Stil-Bibel) und diese Datei. Dann die vorhandenen Modelle `src/three/products/doener/Doener.jsx` und `src/three/products/pizza/Pizza.jsx`: Sie sind die Referenz für Stil und Code.

## Stil (verbindlich)

- **Fluent-Emoji-Cartoon:** wenige, große, pralle Teile. Alles ist gerundet (Bevel an jeder Kante) und überzeichnet. Kein Fotorealismus, kein Mittelding.
- **Wie von Hand gelegt:** keine perfekten Raster, Ringe oder Symmetrien. Nimm eine lesbare Grundanordnung und gib ihr mit `jitter()` aus `src/three/geo.js` feste Zufallsvariation (Lage, Drehung, Neigung, Größe). Formen bekommen `wobble`. Alles ist deterministisch (seeded), kein `Math.random()`.
- **Texturen gemalt, nicht fotografisch:** klare, lesbare Details wie Sesam, Fettpunkte, Adern oder Röstflecken. Kein Rauschen-Grau. Normal-Stärke niedrig. Rote Lebensmittel eher matt (Glanz macht sie rosa).
- **Materialien** kommen aus der gemeinsamen Bibliothek. Eigene Materialien baust du mit den Helfern aus `src/three/materials/index.js` (`textured`, `plain`, `once`, `wet`, `triplanar`). Jedes Material bekommt einen passenden `rim` (Farbe des Randschimmers).
- **Maßstab:** 1 Einheit = 10 cm. Ursprung Mitte unten, +Y oben, Vorderseite +Z.
- **Keine Animationen.** Alles, was sich ändert, läuft über `approach()` aus `src/three/motion.js`. Der Schalter ist aus, später schalten wir dort Animationen ein.

## Dateien

Arbeite nur in den Dateien deines Pakets (siehe Auftrag). Gemeinsame Dateien änderst du nur so:

| Was | Wo | Wie |
|---|---|---|
| Texturen | `src/three/materials/recipes/<paket>.js` | eine Zeile `export * from './recipes/<paket>.js';` ans Ende von `recipes.js`. Keys eindeutig, mit Paket-Präfix (z. B. `storeTiles`) |
| Materialien | `src/three/materials/<paket>.js` | direkt in deinen Modellen importieren |
| Texte | `src/i18n/de/<paket>.js` | in `src/i18n/de/index.js` importieren und in `parts` aufnehmen. Wird tief gemerged, du darfst also `products`/`ingredients` erweitern |
| Modelle/Szenen | `src/three/<bereich>/<paket>/…` | je eine Zeile im `models`-Objekt in `src/three/products/index.js` (mit `kind`, `view`) |
| Seiten | die Stub-Datei in `src/pages/` | Routen stehen schon in `src/App.jsx` |

Alles Markenspezifische (Name, Farben, Adresse, Liefergebühren) liest du aus `src/brand/brand.js`. Nichts davon hart codieren. Alle sichtbaren Texte laufen über i18n (`useI18n().t`).

## Prüfen (Pflicht)

Starte **keinen** lokalen Server. So geht es ohne:

```bash
npm install --prefer-offline --no-audit --no-fund   # einmal pro Worktree
npx vite build --mode single                        # muss fehlerfrei durchlaufen
node scripts/shot.mjs '#/studio?m=<model-id>' /tmp/<name>   # Screenshot → /tmp/<name>-main.jpg
node scripts/shot.mjs '#/bestellen' /tmp/shop '[{"wait":2000,"shot":"top"}]'
```

`steps` können JS ausführen (`eval`), z. B. Buttons klicken. Sieh dir die Screenshots mit dem Read-Tool an und iteriere, bis es gut aussieht. Die Diagnose-Zeile unten im Studio zeigt Shader- und Laufzeitfehler. Sie muss fehlerfrei sein.

## Abschluss

- Committe auf deinem Branch mit klaren Messages. Nicht pushen.
- Am Ende berichtest du: was gebaut ist, welche gemeinsamen Dateien du angefasst hast (mit den genauen Zeilen), die Pfade zu 1–3 finalen Screenshots und was offen ist.
