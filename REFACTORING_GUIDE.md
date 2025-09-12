# Vivideo - Refaktoryzacja do React-like Components

## 🎯 Przegląd refaktoryzacji

Ten projekt został przeprowadzony w celu reorganizacji kodu Vivideo w strukturę podobną do React, aby uczynić go bardziej zrozumiałym, łatwiejszym w utrzymaniu i rozbudowie.

## 📁 Nowa struktura komponentów

### `/src/components/reactlike/`

```
reactlike/
├── Component.js              # Bazowa klasa komponentu (jak React.Component)
├── VivideoMainPanel.js       # Główny kontener aplikacji
├── HeaderSection.js          # Nagłówek z przyciskami i funkcją przeciągania
├── CollapseMenuSection.js    # Sekcja z możliwością zwijania/rozwijania
├── SpeedControllerSection.js # Kontrolki prędkości odtwarzania
├── OptionsSection.js         # Ustawienia i opcje
├── SliderElement.js          # Pojedynczy slider (brightness, contrast, itp.)
├── FooterSection.js          # Dolna sekcja z profilami i motywami
├── ComponentLoader.js        # Ładowanie komponentów
└── components.css            # Style dla wszystkich komponentów
```

## 🧩 Architektura komponentów

### 1. **Component.js** - Bazowa klasa

```javascript
class Component {
  constructor(props = {})
  setState(newState, callback)
  render() // Musi być zaimplementowana w klasach potomnych
  mount(parentElement)
  unmount()
  componentDidMount()
  componentDidUpdate(prevState)
  componentWillUnmount()
}
```

### 2. **VivideoMainPanel.js** - Główny kontener

```jsx
<VivideoMainPanel
  isVisible={false}
  collapsed={false}
  theme="cybernetic"
  position={{ x: 20, y: 20 }}
  settings={settingsObject}
  profiles={profilesArray}
  activeProfile="DEFAULT"
  onClose={() => {}}
  onSettingsChange={(settings) => {}}
  onProfileSelect={(profileName) => {}}
  // ... inne event handlery
/>
```

### 3. **SliderElement.js** - Kontrolki sliderów

```jsx
<SliderElement
  name="brightness"
  defaultValue={0}
  minValue={-100}
  maxValue={100}
  minValueExtended={-200}
  maxValueExtended={200}
  unit="%"
  extendedLimits={false}
  onChange={(name, value) => {}}
/>
```

### 4. **HeaderSection.js** - Nagłówek

```jsx
<HeaderSection
  title="Vivideo"
  version="1.0.0"
  collapsed={false}
  theme="cybernetic"
  onClose={() => {}}
  onToggleCollapse={(collapsed) => {}}
  onDragStart={(event) => {}}
  onDrag={(event, offset) => {}}
  onDragEnd={(event) => {}}
/>
```

### 5. **SpeedControllerSection.js** - Kontrola prędkości

```jsx
<SpeedControllerSection
  speed={1.0}
  speedStep={0.25}
  minSpeed={0.25}
  maxSpeed={4.0}
  onSpeedChange={(speed) => {}}
/>
```

### 6. **OptionsSection.js** - Opcje i ustawienia

```jsx
<OptionsSection
  extendedLimits={false}
  autoActivate={true}
  workOnImages={false}
  compareMode={false}
  onExtendedLimitsChange={(enabled) => {}}
  onAutoActivateChange={(enabled) => {}}
  onResetAll={() => {}}
/>
```

### 7. **FooterSection.js** - Dolna sekcja

```jsx
<FooterSection
  activeTab="profiles"
  activeProfile="DEFAULT"
  activeTheme="cybernetic"
  profiles={profilesArray}
  themes={themesArray}
  onTabChange={(tab) => {}}
  onProfileSelect={(profileName) => {}}
  onThemeSelect={(themeName) => {}}
  onCreateProfile={() => {}}
  onDeleteProfile={(profileName) => {}}
/>
```

## 🔄 Cykl życia komponentów

### 1. **Tworzenie komponentu**

```javascript
const component = new HeaderSection({
  title: 'Vivideo',
  onClose: () => console.log('Zamknięto')
});
```

### 2. **Montowanie do DOM**

```javascript
const container = document.querySelector('.header-container');
component.mount(container);
```

### 3. **Aktualizacja stanu**

```javascript
component.setState({
  collapsed: true
});
```

### 4. **Odmontowanie**

```javascript
component.unmount();
```

## 📊 Porównanie ze starą strukturą

### Przed refaktoryzacją:

```
content.js (1225 linii) - wszystko w jednym pliku
├── VivideoController class
├── Bezpośrednie manipulacje DOM
├── Hardkodowane HTML stringi
├── Mieszane logika biznesowa z UI
└── Trudne w utrzymaniu i rozbudowie
```

### Po refaktoryzacji:

```
content-refactored.js (600 linii) - tylko logika biznesowa
├── VivideoController class
├── Wykorzystuje komponenty React-like
├── Czysta separacja warstw
├── Łatwe testowanie i rozbudowa
└── Modularna architektura

components/reactlike/ - komponenty UI
├── Każdy komponent ma jedną odpowiedzialność
├── Reużywalne komponenty
├── React-like API
└── Łatwe w utrzymaniu
```

## 🎨 System stylów

### Nowy CSS (`components.css`)

- **Scoped styles** - każdy komponent ma swoje style
- **Theme support** - wsparcie dla motywów (cybernetic, casual)
- **Responsive design** - responsywne na różnych rozdzielczościach
- **Accessibility** - style focus dla dostępności
- **Animations** - płynne animacje i przejścia

### Przykład użycia motywów:

```css
.vivideo-main-panel[data-theme='cybernetic'] {
  border-color: rgba(0, 255, 0, 0.3);
  background: rgba(5, 20, 5, 0.95);
}

.vivideo-main-panel[data-theme='casual'] {
  border-color: rgba(0, 191, 255, 0.3);
  background: rgba(10, 10, 35, 0.95);
}
```

## 🚀 Przewagi nowej architektury

### 1. **Czytelność kodu**

- Każdy komponent ma pojedynczą odpowiedzialność
- Jasne API z props i event handlers
- Łatwe do zrozumienia hierarchie komponentów

### 2. **Łatwość utrzymania**

- Modularna struktura
- Możliwość testowania każdego komponentu osobno
- Łatwe debugowanie

### 3. **Rozszerzalność**

- Łatwe dodawanie nowych komponentów
- Reużywalność komponentów
- Konsystentne API

### 4. **Podobieństwo do React**

- Znajoma struktura dla deweloperów React
- Props, state, lifecycle methods
- Event handling patterns

## 🔧 Przykłady użycia

### Tworzenie nowego slidera:

```javascript
const brightnessSlider = new SliderElement({
  name: 'brightness',
  defaultValue: 0,
  minValue: -100,
  maxValue: 100,
  unit: '%',
  onChange: (name, value) => {
    console.log(`${name} changed to ${value}`);
  }
});

brightnessSlider.mount(document.querySelector('.controls-container'));
```

### Aktualizacja ustawień:

```javascript
mainPanel.updateSettings({
  brightness: 50,
  contrast: 25,
  saturation: 10
});
```

### Zmiana motywu:

```javascript
mainPanel.applyTheme('cybernetic');
```

## 📝 Migracja ze starego kodu

### Stary sposób:

```javascript
// Bezpośrednia manipulacja DOM
const slider = document.getElementById('brightness-slider');
slider.addEventListener('input', (e) => {
  // Logika obsługi
});
```

### Nowy sposób:

```javascript
// Komponent z jasnym API
const slider = new SliderElement({
  name: 'brightness',
  onChange: (name, value) => {
    // Czysta logika biznesowa
  }
});
```

## 🔍 Debugging

### DevTools Inspector:

- Każdy komponent ma atrybut `data-component`
- Łatwe znajdowanie elementów w DevTools
- Konsystentne nazwy klas CSS

### Console debugging:

```javascript
// Sprawdzenie stanu komponentu
console.log(mainPanel.state);

// Sprawdzenie czy komponent jest zamontowany
console.log(mainPanel.mounted);

// Lista wszystkich komponentów potomnych
console.log(mainPanel.children);
```

## 🎯 Następne kroki

1. **Testowanie** - przeprowadzenie testów wszystkich funkcjonalności
2. **Dokumentacja API** - szczegółowa dokumentacja każdego komponentu
3. **Unit Tests** - napisanie testów jednostkowych
4. **Performance optimizations** - optymalizacje wydajności
5. **New features** - łatwe dodawanie nowych funkcjonalności

## 📚 Dodatkowe zasoby

- `content-refactored.js` - główny kontroler używający nowych komponentów
- `components.css` - style dla wszystkich komponentów
- `manifest.json` - zaktualizowana konfiguracja rozszerzenia

---

Ta refaktoryzacja znacznie poprawia czytelność, utrzymywalność i rozszerzalność kodu Vivideo, czyniąc go bardziej podobnym do nowoczesnych aplikacji React.
