# DönerBude – Konzept

Konzept-Shop für einen Döner- und Pizzaladen. Zwei Wege in denselben Laden:

- **Erlebnis (3D-Landing):** Man sieht den Laden von außen, scrollt hinein und wählt Produkte direkt von Tresen, Ofen, Tisch und Kühlschrank.
- **Express-Shop:** klassische Bestellseite im Stil von Lieferando für alle, die schnell bestellen wollen.

Beide teilen sich Warenkorb, Speisekarte und Konfigurator. Zielplattform ist vorerst **nur Desktop**.

---

## 1. Marke

| | |
|---|---|
| Name | **DönerBude** |
| Logo-Motiv | Neonschriftzug „DönerBude“, das **Ö** als Akzent (Punkte als zwei Glutpunkte) |
| Tonalität | clean, professionell, selbstbewusst. Keine Kalauer. Muss werbetauglich sein. |
| Farben | Off-White `#FBF6EE`, Bude-Rot `#D7362B`, Senf `#F2B233`, Anthrazit `#22201E`, Kräutergrün `#5E9A3A` |
| Schrift | runde, fette Grotesk für Headlines, neutrale Sans für Text |

**Austauschbarkeit:** Alles Markenspezifische liegt in `src/brand/`: Name, Farben, Schriften, Slogans, Adresse, Öffnungszeiten, Liefergebühren und Logo. Laden, Schild, Becher, Kartons, Papier und Schürzen lesen nur daraus. Wenn man diese Dateien tauscht, ist der Laden umgebrandet.

## 2. Seiten

| Route | Inhalt |
|---|---|
| `/` | 3D-Erlebnis (Scroll-Reise) |
| `/bestellen` | Express-Shop |
| `/baukasten/pizza`, `/baukasten/doener` | Konfigurator, von beiden Wegen erreichbar |
| `/warenkorb`, `/kasse` | gemeinsamer Checkout (Demo, keine echte Zahlung) |
| `/info` | Öffnungszeiten, Lieferzone, Impressum |
| `/studio` | Foto-Modus: jedes Modell freigestellt rendern (intern / Marketing) |

Auf der Landing gibt es immer einen sichtbaren Button **„Direkt bestellen“**. Ohne WebGL leitet die Seite automatisch zum Express-Shop weiter.

## 3. Scroll-Reise

Die Kamera fährt fest auf Schienen. Wo es sinnvoll ist, erlaubt die Maus eine leichte Drehung.

| # | Szene | Kamera | Interaktion |
|---|---|---|---|
| 0 | **Außen, Abend**: Laden als Diorama auf Sockel, Schild flackert an, Dampf aus dem Abzug | Totale, langsame Kreisfahrt | Maus dreht ±20° |
| 1 | **Anfahrt**: Fahrt zur Tür, Tür schwingt auf | Dolly | – |
| 2 | **Innenraum-Übersicht** | steht | leichter Maus-Parallax |
| 3 | **Tresen / Spieß**: Döner, Dürüm, Box, Teller, Lahmacun | Schwenk | Produkte anklickbar, Spieß rotiert |
| 4 | **Pizzaofen**: Pizzen auf der Ablage, Feuer | Schwenk | anklickbar, „Eigene Pizza bauen“ |
| 5 | **Tisch**: Beilagen, Saucen, Dessert | Aufsicht | anklickbar |
| 6 | **Kühlschrank**: Getränke | Tür öffnet | anklickbar |
| 7 | **Kasse**: Tablett mit dem aktuellen Warenkorb | Schluss-Shot | „Zur Kasse“ |

Rechts gibt es eine Stationsnavigation mit Punkten (Tresen, Ofen, Tisch, Getränke).

**Produkt-Klick:** Das Produkt schwebt nach vorne, der Hintergrund wird unscharf und rechts öffnet ein Panel mit Preis, Größe, Extras und „In den Warenkorb“. Das Produkt lässt sich dort frei drehen.

## 4. Speisekarte (Demo)

- **Döner:** Döner, Dürüm, Dönerbox, Dönerteller, Lahmacun
- **Pizza:** Margherita, Salami, Schinken, Hähnchen, Tonno, Vegetaria, Eigene Pizza
- **Beilagen:** Pommes, Salat, Börek
- **Saucen:** Knoblauch, Kräuter, Scharf, Cocktail
- **Dessert:** Baklava
- **Getränke:** Ayran, Cola, Wasser, Limo

Pizzavarianten sind Zutaten-Kombinationen im Baukasten und brauchen keine eigenen Modelle.

## 5. Baukasten

**Prinzip:** Ein Produkt besteht aus **Schichten in fester Reihenfolge**. Jede Zutat hat eine **feste Grundanordnung**, die mit fester Zufallsvariation (Lage, Drehung, Neigung, Größe) wie von Hand gelegt wirkt. Nichts liegt auf einem perfekten Raster oder Ring, und es sieht bei jedem Laden gleich aus. Hinzufügen bedeutet, die Zutat fällt animiert an ihren Platz. Entfernen bedeutet, sie hebt ab und ist weg, nicht bloß versteckt.

**Pizza:** Teigling → Sauce (Tomate / Weiß / BBQ) → Käse → Beläge (Salami, Schinken, Hähnchen, Tomate, Paprika, Zwiebel, Pilze, Oliven, Mais, Thunfisch, Jalapeños) → **Backen** (Käse schmilzt, Rand bräunt, Dampf) → Rucola nach dem Backen.

**Döner:** Brot (aufgeklappt) → Fleisch (Kalb / Hähnchen / Falafel) → Salat → Tomate → Gurke → Zwiebel → Rotkraut → Weißkraut → Feta → Sauce (geträufelt) → Chili. Die Kamera schaut schräg ins offene Brot. Am Ende klappt das Brot zu und wird in Papier gewickelt.

**UI:** links das große 3D-Produkt, rechts Zutaten-Chips mit Mini-Render, Aufpreis und Live-Gesamtpreis.

## 6. 3D-Stil

- **Formen:** klar cartoonig im Stil von Microsoft Fluent Emoji 3D: wenige, große, pralle Teile, alles gerundet und überzeichnet. Kein Mittelding zwischen Foto und Spielzeug.
- **Farben:** satt und leuchtend, mit weichem Verlauf (oben heller, unten wärmer) und farbigem Randschimmer.
- **Oberflächen:** echte Texturen statt nur Farbe, aber gemalt statt fotografisch: Details sind klare, lesbare Formen (Sesam, Fettpunkte, Blattadern, Röstflecken), kein Rauschen. Rote Lebensmittel eher matt, sonst werden sie rosa.
  - Brot: Poren, Sesam, Röstverlauf
  - Fleisch: Fasern, Röstkanten, Fettglanz
  - Käse: Blasen, Bräunung
  - Salami: Fettstücke, Pfeffer
  - Salat: Blattadern
- **Licht:** weich und warm, leichtes „Durchscheinen“ bei Salat, Tomate und Käse.
- **Innenraum:** derselbe Stil, aber ruhiger (Fliesen, Holz, Edelstahl). Die Produkte sind die Hauptrolle.

### Stil-Bibel (verbindlich für alle Modelle)

- **Maßstab:** 1 Einheit = 10 cm. Eine Pizza hat Ø 3,0, ein Döner ist 2,4 lang.
- **Licht:** Alle Modelle werden im gemeinsamen Studio-Licht (`src/three/studio`) abgenommen.
- **Materialien:** nur aus der gemeinsamen Bibliothek `src/three/materials`. Neue Materialien kommen dort hinein, nicht ins Modell.
- **Formen:** keine harten Kanten. Alles ist gerundet, Segmentanzahl reicht für eine glatte Silhouette.
- **Ursprung:** Mitte unten auf der Standfläche, +Y nach oben, Vorderseite zeigt nach +Z.

### Modell-Schnittstelle

Jedes Produkt exportiert dasselbe Format:

```
{ id, name, layers: [{ id, label, default, price }], Component }
```

`Component` bekommt die aktiven Zutaten als Liste und animiert sie selbst rein und raus. Dadurch lässt sich ein Code-Modell später **einzeln** gegen ein GLB-Modell aus Blender austauschen, ohne dass Shop oder Baukasten etwas merken.

## 7. Express-Shop (Lieferando-Stil)

- **Header:** Logo, Umschalter Lieferung / Abholung, Adresse, geschätzte Zeit, Mindestbestellwert
- **Laden-Kopf:** Banner aus dem 3D-Laden gerendert, Bewertung, Öffnungszeiten
- **Kategorien:** Sticky-Leiste, scrollt mit; Suche
- **Produktliste:** Name, Beschreibung, Preis, **Thumbnail aus den 3D-Modellen gerendert**
- **Produkt-Dialog:** Größe, Extras, Saucen; Pizza und Döner zusätzlich „Im Baukasten öffnen“
- **Warenkorb-Sidebar:** Liefergebühr, Fortschritt zum Mindestbestellwert, Checkout

## 8. Marketing

- `/studio` rendert jedes Produkt und jede Szene freigestellt in hoher Auflösung. Daraus entstehen Thumbnails, Social-Media-Bilder, OG-Images und Flyer.
- Ladebildschirm im Markenlook.

## 9. Sprache

Vorerst nur Deutsch. Alle Texte laufen aber über i18n (`src/i18n/de.js`), damit weitere Sprachen ohne Umbau dazukommen.

## 10. Vorgehen

| Phase | Inhalt | Wer |
|---|---|---|
| 0 | Gerüst, Marke, Speisekarte, i18n, Material-Bibliothek, Studio-Licht | Hauptsession |
| **Qualitätstest** | **Ein Döner und eine Pizza in voller Qualität. Entscheidung: Code reicht / Mischform mit vorgerenderten Texturen / GLB aus Blender** | Hauptsession |
| 1 | parallel: Laden außen · Laden innen · Döner-Familie · Pizza-Beläge · Beilagen & Getränke · Express-Shop · Checkout & Info | Sonnet-Schwarm, ein Agent pro Paket, keine geteilten Dateien |
| 2 | Scroll-Reise, Produkt-Panel, Baukasten-Animationen, Studio-Thumbnails | wenige Agenten / Hauptsession |
| 3 | Stil-Abgleich aller Modelle, Performance, Texte | Review |
