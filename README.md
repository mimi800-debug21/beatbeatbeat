# Bieten & Haben

Kirmes-Auktion für zwei Kinder auf **einem** Gerät (Hot-Seat). Wer zuerst das Ziel an Gegenständen ersteigert oder ohne Geld dasteht, gewinnt – oder bekommt am Ende alles geschenkt, damit niemand leer ausgeht.

Spielbar unter: <https://micro8.github.io/beatbeatbeat/> (sobald GitHub Pages aktiviert ist).

## Spielregeln

- Beide Spieler starten mit demselben Budget (Standard: 20 €).
- Jeder Spieler merkt sich eine Zielanzahl an Gegenständen (Standard: 5).
- Das **Glücksrad** bestimmt, wer zuerst bieten darf – entweder nur zu Beginn oder vor jedem Stück (im Setup wählbar).
- Geboten wird in ganzen Euro-Schritten (`+1`, `+5`, `+10`, `All-in`). Erhöhen kostet immer mindestens 1 € über das aktuelle Gebot. Wer überbietet, gibt sein Geld wie beim echten Versteigern aus.
- „Kannst haben": Der andere Spieler lässt das Stück beim aktuellen Preis durchgehen. Der Preis wird vom Budget des Gewinners abgezogen.
- **Geschenkt:** Sobald jemand pleite ist **oder** sein Ziel erreicht hat, bekommt der jeweils andere alle restlichen Gegenstände geschenkt. Niemand geht leer aus.
- Die Auswertung zeigt am Ende nur die Zahlen – die Kinder entscheiden selbst, wer gewonnen hat.

## Entwicklung

- **Stack:** Reines HTML/CSS/JS – keine Dependencies, kein Build-Schritt, offline lauffähig.
- **Logik:** `js/game.js` ist eine reine, testbare Kernfunktion (`createGame`, `placeBid`, `giveUp`, `advanceAfterSold`, `giftInfo`, ...). Die UI in `js/ui.js` rendert nur Templates, `js/app.js` verdrahtet Klicks und Phasen.
- **TDD:** Die Tests in `test/` prüfen die Spiellogik ohne Browser. Starten mit:
  ```sh
  npm test
  ```
- **Lokal testen:**
  ```sh
  python -m http.server 4173
  ```
  und dann <http://127.0.0.1:4173/> öffnen.

## Struktur

```
index.html       App-Gerüst, Fonts (Fredoka/Nunito), Live-Region
css/styles.css   Design-Tokens + alle Screens
js/data.js       Katalog (Kategorie „Freizeitpark")
js/game.js       Spiellogik (browser + Node testbar)
js/ui.js         Screen-Templates & Helpers
js/wheel.js      Glücksrad-Dreh-Animation
js/sounds.js     WebAudio-Sound-Effekte (mutebar)
js/app.js        State, Event-Verbindung, Prefs (localStorage)
test/            Node-Tests für Katalog & Logik
```

## Deployment (GitHub Pages)

1. Repository auf GitHub anlegen und pushen.
2. In den Repository-Einstellungen **Pages > Source > Deploy from a branch** auf `main` / Root setzen.
3. Die Datei `.nojekyll` ist bereits vorhanden, damit die Dateien so wie sind ausgeliefert werden.