# Vivideo - Extended Limits Feature

## 📋 Opis funkcjonalności

Dodano funkcjonalność rozszerzonych limitów do rozszerzenia Vivideo, która pozwala użytkownikom:
- Przełączać między limitami "casual-friendly" a pełnym technicznym potencjałem
- Uzyskać dostęp do ekstremalnych efektów wizualnych
- Zachować ustawienia rozszerzonych limitów w profilach
- Wizualnie rozróżnić tryb maksymalnych limitów

## 🎛️ Szczegółowe porównanie limitów

Każda kontrolka ma indywidualnie dobrane limity na podstawie researchu i możliwości technicznych CSS filters:

### **Brightness (Jasność)**
- **Standard**: -50% do +80% (CSS: 0.5 do 1.8) - usuable dla casualnych użytkowników
- **Extended**: -90% do +300% (CSS: 0.1 do 4.0) - pełny techniczny zakres

### **Contrast (Kontrast)**  
- **Standard**: -70% do +100% (CSS: 0.3 do 2.0) - widoczne poprawy bez przesady
- **Extended**: -100% do +400% (CSS: 0 do 5.0) - ekstremalne efekty

### **Saturation (Nasycenie)**
- **Standard**: -80% do +60% (CSS: 0.2 do 1.6) - naturalny wygląd kolorów
- **Extended**: -100% do +200% (CSS: 0 do 3.0) - artystyczne efekty

### **Gamma (Korekcja gamma)**
- **Standard**: 0.4 do 2.2 - praktyczny zakres korekcji gamma
- **Extended**: 0.1 do 4.0 - pełny techniczny zakres SVG

### **Color Temperature (Temperatura kolorów)**
- **Standard**: -60 do +60 - zauważalne ale naturalne zmiany
- **Extended**: -100 do +100 - ekstremalne przesunięcia kolorów

### **Sharpness (Ostrość)**
- **Standard**: 0% do 60% - widoczna poprawa bez artefaktów
- **Extended**: 0% do 120% - agresywne wyostrzanie

## 🎯 Jak używać

### Włączanie rozszerzonych limitów:
1. Otwórz panel Vivideo (`Alt + V`)
2. Znajdź checkbox **"Extended limits (max technical range)"** w sekcji ustawień
3. Zaznacz checkbox - kontrolki się przebudują z nowymi limitami
4. Zauważ wizualne wskazówki: `[MAX]` przy każdej kontrolce

### Wyłączanie:
1. Odznacz checkbox
2. Wartości powyżej standardowych limitów zostaną automatycznie obcięte do maksymalnych casualowych wartości
3. Kontrolki powrócą do standardowego wyglądu

## 🎨 Wizualne wskazówki

Gdy rozszerzone limity są włączone:
- **Oznaczenie `[MAX]`** przy każdej kontrolce z efektem świecenia
- **Kolorowa linia** po lewej stronie kontrolek
- **Kolory dostosowane do motywu:**
  - Cybernetic: zielone akcenty z efektem świecenia
  - Casual: niebieskie akcenty z efektem świecenia

## 🔧 Implementacja techniczna

### Zmodyfikowane pliki:
- `src/content.js` - dodano pole `extendedLimits` do settings
- `src/utils/uiHelper.js` - rozszerzona funkcja `clampValue()` i `getControlLimits()`
- `src/components/videoControls.js` - dynamiczne generowanie HTML z limitami
- `styles.css` - style wizualnych wskazówek
- `src/components/settingsManager.js` - obsługa w import/export (automatyczna)

### Kluczowe funkcje:

**UIHelper.getControlLimits(control, extendedLimits)**
```javascript
static getControlLimits(control, extendedLimits = false) {
  switch (control) {
    case 'brightness':
      // Casual: -50% to +80%, Extended: -90% to +300%
      return extendedLimits 
        ? { min: -90, max: 300, step: 1 }
        : { min: -50, max: 80, step: 1 };
    case 'contrast':
      // Casual: -70% to +100%, Extended: -100% to +400%
      return extendedLimits 
        ? { min: -100, max: 400, step: 1 }
        : { min: -70, max: 100, step: 1 };
    // ... inne kontrolki z indywidualnymi limitami
  }
}
```

**UIHelper.clampValue(control, value, extendedLimits)**
```javascript
static clampValue(control, value, extendedLimits = false) {
  const limits = this.getControlLimits(control, extendedLimits);
  return Math.max(limits.min, Math.min(limits.max, value));
}
```

**Przebudowa UI:**
```javascript
updateSliderLimits() {
  // Przebudowuje sekcję kontrolek z nowymi limitami
  const controlsSection = this.container.querySelector('.vivideo-controls-section');
  if (controlsSection) {
    controlsSection.innerHTML = this.videoControls.createControlsHTML();
    this.videoControls.bindEvents(this.container);
    this.updateUI();
  }
}
```

## ✅ Funkcjonalności

### Podstawowe działanie:
- [x] Checkbox przełącza między normalnymi a podwójnymi limitami
- [x] Dynamiczna przebudowa sliderów i input'ów
- [x] Automatyczne obcinanie wartości przy zmianie limitów
- [x] Zachowanie ustawień w pamięci przeglądarki

### Wizualne wskazówki:
- [x] Oznaczenie `[2x]` przy kontrolkach
- [x] Kolorowa linia po lewej stronie
- [x] Kolory dostosowane do motywów
- [x] CSS klasa `extended-limits` na kontenerze

### Integracja:
- [x] Obsługa w export/import ustawień
- [x] Zachowanie w profilach użytkownika
- [x] Kompatybilność z wszystkimi motywami
- [x] Zachowanie pozycji i widoczności panelu przy przebudowie

### Bezpieczeństwo:
- [x] Automatyczne obcinanie wartości do nowych limitów
- [x] Walidacja input'ów
- [x] Graceful handling błędów
- [x] Zachowanie spójności danych

## 🎯 Użyteczne przypadki

### Kiedy używać rozszerzonych limitów:

**🌙 Bardzo ciemne filmy:**
- Brightness +200% do +300% dla ekstremalnie ciemnych scen
- Gamma 0.2 do 0.4 dla przejaskrawionych filmów

**🎨 Artystyczne efekty:**
- Saturation -100% dla pełnej skali szarości
- Saturation +150% do +200% dla surrealistycznych kolorów
- Contrast +200% do +400% dla dramatycznego efektu
- Color temperature ±100 dla stylizacji filmowej

**📺 Problematyczne treści:**
- Gamma 3.5 do 4.0 dla bardzo ciemnych scen
- Contrast -100% dla odwrócenia kontrastu
- Sharpness 100%+ dla bardzo rozmytych obrazów

**🎮 Gaming i streaming:**
- Brightness +150% dla lepszej widoczności w grach FPS
- Contrast +300% dla podkreślenia szczegółów
- Specjalne kombinacje dla streamów

**⚡ Ekstremalne przypadki:**
- Brightness -90% + Gamma 4.0 dla efektu "rentgenowskiego"
- Contrast +400% + Saturation 0% dla efektu high-contrast B&W
- Color temperature -100 + Saturation +200% dla cyberpunkowych efektów

## 🧪 Testowanie

Użyj pliku `test-extended-limits.html` do przetestowania funkcjonalności:

### Scenariusze testowe:
1. **Podstawowe działanie** - włączanie/wyłączanie checkbox
2. **Zachowanie wartości** - sprawdź obcinanie przy zmianie limitów
3. **Profile** - zapisz/wczytaj profile z rozszerzonymi limitami
4. **Import/Export** - eksportuj i zaimportuj ustawienia
5. **Motywy** - zmień motyw z włączonymi limitami
6. **Input'y** - wprowadź wartości ręcznie poza limity

## ⚠️ Uwagi

### Standardowe limity (casual-friendly):
- **Zaprojektowane dla wszystkich użytkowników** - bezpieczne i przydatne wartości
- **Zachowują użyteczność obrazu** - poprawiają bez niszczenia
- **Naturalne efekty** - nie wprowadzają dziwnych artefaktów
- **Użyteczny zakres** - pokrywają 90% typowych przypadków użycia

### Extended limity (max technical):
- **Dla zaawansowanych użytkowników** - mogą powodować ekstremalne efekty
- **Pełne możliwości techniczne** - wykorzystują maksymalny potencjał CSS filters
- **Artefakty wizualne** - przy skrajnych wartościach mogą występować dziwne efekty
- **Artystyczne efekty** - przeznaczone do kreatywnych i specjalnych zastosowań

### Przykłady ekstremalnych efektów:
- **Brightness -90%**: Prawie całkowicie czarny obraz
- **Brightness +300%**: Przesycony białym światłem
- **Contrast +400%**: Bardzo ostre przejścia, możliwe artefakty
- **Gamma 0.1**: Nieprawidłowe odwzorowanie kolorów
- **Gamma 4.0**: Bardzo nietypowa korekta gamma
- **Saturation +200%**: Nienaturalne, komiksowe kolory
- **Sharpness 120%**: Możliwe artefakty wyostrzania

**Użyj extended limitów z rozsądkiem** - są przeznaczone dla konkretnych, zaawansowanych przypadków użycia.

## 🔄 Kompatybilność

- ✅ Wszystkie istniejące funkcje
- ✅ Import/Export ustawień
- ✅ Profile użytkownika  
- ✅ Wszystkie motywy (cybernetic, casual)
- ✅ Keyboard shortcuts
- ✅ Auto-activate
- ✅ Work on images

## 🚀 Przyszłe rozszerzenia

Potencjalne przyszłe funkcjonalności:
- Custom limity (użytkownik ustawia własne zakresy)
- Presets limitów (3x, 5x, 10x)
- Ostrzeżenia przed ekstremalными wartościami
- Quick reset do bezpiecznych wartości
- Profile-specific limits (różne limity dla różnych profili)
