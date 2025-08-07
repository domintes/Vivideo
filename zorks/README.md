# 📁 Folder Zorks - Dokumentacja i Testy

Ten folder zawiera wszystkie pliki pomocnicze, które nie mają bezpośredniego wpływu na działanie rozszerzenia Vivideo.

## 📋 Zawartość folderu:

### 📖 Dokumentacja i Changelogi:
- `CHANGELOG-v3.md` - Kompletny changelog wersji 3.0
- `CHANGES.md` - Lista poprawek i usprawnień
- `DEBUG-v3.1.md` - Instrukcje debugowania i rozwiązywania problemów
- `HSL-TESTING-GUIDE.md` - Przewodnik testowania HSL Color Picker
- `REFACTORING-v4.0.md` - Dokumentacja refaktoryzacji v4.0
- `UI-FIXES-v4.1.md` - Dokumentacja poprawek UI v4.1
- `UPDATE_v2.md` - Aktualizacja v2.0 z HSL Color Picker

### 🧪 Pliki testowe:
- `test.html` - Podstawowy plik testowy
- `test-v3.html` - Testy dla wersji 3.0
- `test-enhanced.html` - Rozszerzone testy funkcjonalności
- `test-refactoring-v4.html` - Testy refaktoryzacji v4.0
- `test-ui-fixes-v4.1.html` - Testy poprawek UI v4.1
- `debug-test.html` - Podstawowe testy debugowe
- `deep-debug-test.html` - Zaawansowane testy debugowe
- `hsl-color-demo.html` - Demo HSL Color Picker

### 🗃️ Backup i archiwum:
- `content-old-backup.js` - Backup starego content.js sprzed refaktoryzacji

## 🎯 Cel organizacji:

Przeniesienie tych plików do oddzielnego folderu pozwala na:
- **Uporządkowanie** głównego katalogu rozszerzenia
- **Łatwiejsze zarządzanie** kodem produkcyjnym
- **Zachowanie dokumentacji** dla przyszłych deweloperów
- **Dostęp do testów** gdy są potrzebne

## 🚀 Struktura głównego katalogu po organizacji:

```
Vivideo/
├── src/                 # Kod źródłowy rozszerzenia
├── icons/              # Ikony rozszerzenia
├── zorks/              # Dokumentacja i testy (ten folder)
├── background.js       # Service worker
├── manifest.json       # Konfiguracja rozszerzenia
├── popup.html         # Interface popup
├── popup.js           # Logika popup
├── styles.css         # Style GUI
└── README.md          # Główna dokumentacja
```

**Wszystkie pliki testowe i dokumentacyjne są nadal dostępne, ale nie zaśmiecają głównego katalogu rozszerzenia.**
