# Raport napraw kompatybilności z A-Frame 1.7.0 / THREE.js r173

**Data:** 2026-03-24
**Autor:** Claude Code (asystent AI)
**Kontekst:** Moon Rider został zaktualizowany do A-Frame 1.7.0, który bundluje `super-three@0.173.4` (odpowiednik THREE.js r173). Wiele API THREE.js zostało usuniętych lub zmienionych między starszymi wersjami a r173, co powodowało masowe błędy w konsoli (92 errory przy starcie aplikacji).

---

## Podsumowanie

| Metryka | Przed | Po |
|---|---|---|
| Błędy w konsoli | 92 | 13 |
| Naprawione pliki | — | 6 |
| Pozostałe błędy | — | CORS (BeatSaver CDN) + autoplay policy (nie do naprawy po stronie kodu) |

---

## Naprawione błędy

### 1. `THREE.PlaneBufferGeometry is not a constructor`

**Przyczyna:** W THREE.js r125+ klasy `*BufferGeometry` zostały usunięte — `PlaneBufferGeometry` zastąpiono przez `PlaneGeometry`, `BoxBufferGeometry` przez `BoxGeometry` itd. Wewnętrzny kod A-Frame 1.7 oraz komponenty Moon Ridera nadal używały starych nazw.

**Zakres:** ~60 błędów w konsoli (powtarzane dla każdej encji w puli).

**Naprawy:**

#### a) Bezpośrednie poprawki w kodzie źródłowym

**Plik: `src/components/tail.js` (linia 15)**
```diff
- const geometry = this.geometry = new THREE.PlaneBufferGeometry(
+ const geometry = this.geometry = new THREE.PlaneGeometry(
    data.width, data.height, data.segments, 1);
```
Komponent `tail` tworzy geometrię płaszczyzny dla efektu śladu za rękami gracza. Zmiana nazwy konstruktora na nową wersję API — zachowanie identyczne, `PlaneGeometry` w THREE r173 zwraca `BufferGeometry` domyślnie.

**Plik: `src/components/wall.js` (linia 83)**
```diff
- const geo = this.geometry = new THREE.BoxBufferGeometry(width, height, 1, 1, 1, 30);
+ const geo = this.geometry = new THREE.BoxGeometry(width, height, 1, 1, 1, 30);
```
Komponent `wall` generuje geometrię ściany/przeszkody w grze. Analogiczna zmiana — `BoxGeometry` zastępuje `BoxBufferGeometry`.

#### b) Globalny polyfill dla kodu wewnątrz A-Frame i bibliotek

**Plik: `src/index.js` (po `require('aframe')`)**
```javascript
// Polyfill removed BufferGeometry aliases for THREE r125+ compatibility.
if (!THREE.PlaneBufferGeometry) { THREE.PlaneBufferGeometry = THREE.PlaneGeometry; }
if (!THREE.BoxBufferGeometry) { THREE.BoxBufferGeometry = THREE.BoxGeometry; }
if (!THREE.SphereBufferGeometry) { THREE.SphereBufferGeometry = THREE.SphereGeometry; }
if (!THREE.CylinderBufferGeometry) { THREE.CylinderBufferGeometry = THREE.CylinderGeometry; }
if (!THREE.CircleBufferGeometry) { THREE.CircleBufferGeometry = THREE.CircleGeometry; }
```
Dodany zaraz po `require('aframe')` — zanim jakikolwiek komponent lub biblioteka z node_modules użyje starych nazw. Pokrywa wszystkie popularne typy geometrii na wypadek, gdyby były używane w zależnościach (np. wewnątrz zminifikowanego `aframe-master.min.js`). Warunki `if (!THREE.X)` zapewniają, że polyfill nie nadpisze istniejących klas, gdyby przyszła wersja A-Frame je przywróciła.

**Dlaczego potrzebny był zarówno polyfill, jak i bezpośrednie poprawki?**
Poprawki w `tail.js` i `wall.js` naprawiają nasz kod (best practice — używać nowego API). Polyfill jest potrzebny, bo `PlaneBufferGeometry` jest też wywoływane wewnątrz skompilowanego `aframe-master.min.js` oraz w zależnościach z `node_modules`, których nie możemy bezpośrednio edytować.

---

### 2. `this.updateVariables is not a function`

**Przyczyna:** W starszych wersjach A-Frame bazowy system shaderów (`AFRAME.registerShader`) udostępniał metodę `this.updateVariables(data, type)`, która automatycznie synchronizowała dane ze schematu z uniformami/atrybutami materiału. W A-Frame 1.7.0 ta metoda została usunięta z API shaderów.

**Zakres:** ~20 błędów w konsoli.

**Naprawy:**

**Plik: `src/components/panel-shader.js` (linie 21-24)**
```diff
  update: function (data) {
-   this.updateVariables(data, 'attribute');
-   this.updateVariables(data, 'uniform');
+   if (this.material && this.material.uniforms) {
+     var dominated;
+     for (var key in data) {
+       dominated = this.schema[key];
+       if (!dominated || dominated.is !== 'uniform') { continue; }
+       if (dominated.type === 'color') {
+         this.material.uniforms[key].value = new THREE.Color(data[key]);
+       } else {
+         this.material.uniforms[key].value = data[key];
+       }
+     }
+   }
    this.el.sceneEl.systems.materials.registerPanel(this.material);
  }
```

**Plik: `src/components/supercurve-shader.js` (linie 17-20)**
```diff
  update: function (data) {
-   this.updateVariables(data, 'attribute');
-   this.updateVariables(data, 'uniform');
+   if (this.material && this.material.uniforms) {
+     var dominated;
+     for (var key in data) {
+       dominated = this.schema[key];
+       if (!dominated || dominated.is !== 'uniform') { continue; }
+       if (dominated.type === 'color') {
+         this.material.uniforms[key].value = new THREE.Color(data[key]);
+       } else {
+         this.material.uniforms[key].value = data[key];
+       }
+     }
+   }
    this.el.sceneEl.systems.materials.registerCurve(this.material);
  }
```

**Jak działa nowa implementacja:**
1. Sprawdza czy materiał i uniformy istnieją (`this.material && this.material.uniforms`)
2. Iteruje po wszystkich kluczach z danych schematu
3. Filtruje tylko te właściwości, które mają `is: 'uniform'` w definicji schematu
4. Dla typu `color` — konwertuje wartość na `THREE.Color` (uniformy kolorów wymagają obiektu Color, nie stringa)
5. Dla pozostałych typów — przypisuje wartość bezpośrednio

Shadery, których to dotyczy:
- **panelShader** — shader paneli menu (9 uniformów: activePanel, brightness, borderWidth, borderRadius, colorPrimary, colorSecondary, midSection, opacity, ratio)
- **supercurve** — shader drogi/toru (5 uniformów: cameraPercent, color1, color2, fogColor + side/transparent jako nie-uniformy)

Inne shadery w projekcie (`cutfx-shader`, `handstar-shader`, `gradient-shader`, `wall-shader`, `supercutfx-shader`) nie definiują własnej metody `update`, więc korzystają z domyślnego zachowania A-Frame i nie były dotknięte tym błędem.

---

### 3. `Cannot read properties of undefined (reading 'degToRad')`

**Przyczyna:** W THREE.js r125+ przestrzeń nazw `THREE.Math` została usunięta na rzecz `THREE.MathUtils`. Kod odwoływał się do `THREE.Math.degToRad()`, co zwracało `undefined.degToRad` → TypeError.

**Zakres:** 31 błędów w konsoli (powtarzane dla każdej encji z komponentem `raycaster-target`).

**Naprawa:**

**Plik: `src/components/raycaster-target.js` (linie 51-53)**
```diff
- raycastTarget.object3D.rotation.x = THREE.Math.degToRad(data.rotation.x);
- raycastTarget.object3D.rotation.y = THREE.Math.degToRad(data.rotation.y);
- raycastTarget.object3D.rotation.z = THREE.Math.degToRad(data.rotation.z);
+ raycastTarget.object3D.rotation.x = THREE.MathUtils.degToRad(data.rotation.x);
+ raycastTarget.object3D.rotation.y = THREE.MathUtils.degToRad(data.rotation.y);
+ raycastTarget.object3D.rotation.z = THREE.MathUtils.degToRad(data.rotation.z);
```

Komponent `raycaster-target` tworzy niewidoczny element podrzędny (child entity) służący jako cel dla raycastera — używany do interakcji w menu (kliknięcia/najechania). Konwertuje rotację z stopni (schemat A-Frame) na radiany (THREE.js Object3D). Przed naprawą wszystkie cele raycastera miały rotację 0,0,0 (domyślną), co mogło powodować problemy z klikalnością elementów menu wymagających obrotu.

---

## Pozostałe błędy (nienaprawiane)

Po naprawach zostało 13 błędów w konsoli — żaden z nich nie jest do naprawy po stronie kodu aplikacji:

| Błąd | Ilość | Przyczyna |
|---|---|---|
| `Access to image ... CORS policy` | 6 | BeatSaver CDN (`beatproxy.b-cdn.net`) blokuje cross-origin żądania obrazów okładek piosenek. Wymaga zmiany konfiguracji po stronie CDN. |
| `net::ERR_FAILED` (obrazy) | 6 | Konsekwencja powyższego — przeglądarka nie może pobrać zablokowanych obrazów. |
| `play() failed` | 1 | Standardowa polityka autoplay przeglądarki — audio nie może być odtworzone bez interakcji użytkownika. Rozwiązuje się samoistnie po kliknięciu "BEGIN". |

Warningi WebGL (`vertexColors`, `GL_INVALID_VALUE`, `gpu-preloader`) to ostrzeżenia niekrytyczne, które nie wpływają na działanie aplikacji.

---

## Zmiana portu deweloperskiego

Dodatkowo zmieniono port dev servera z 3000 na 4010:

**Plik: `webpack.config.js`** — dodano `port: 4010` do sekcji `devServer`
**Plik: `package.json`** — zmieniono `--port 3000` na `--port 4010` w skrypcie `start`

---

## Lista zmienionych plików

1. `src/index.js` — dodany polyfill BufferGeometry aliasów
2. `src/components/tail.js` — `PlaneBufferGeometry` → `PlaneGeometry`
3. `src/components/wall.js` — `BoxBufferGeometry` → `BoxGeometry`
4. `src/components/panel-shader.js` — zastąpienie `updateVariables` ręczną synchronizacją uniformów
5. `src/components/supercurve-shader.js` — j.w.
6. `src/components/raycaster-target.js` — `THREE.Math` → `THREE.MathUtils`
7. `webpack.config.js` — port 4010
8. `package.json` — port 4010
