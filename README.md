# Vivideo - Real-time Video Enhancement

Rozszerzenie do przeglądarek opartych na Chromium, które umożliwia regulację jasności, kontrastu, nasycenia kolorów, temperatury kolorów i gamma dla wszystkich filmów odtwarzanych w przeglądarce w czasie rzeczywistym.

## ✨ Funkcje

- **Brightness** (-100% do +100%) - Regulacja jasności obrazu
- **Contrast** (-100% do +100%) - Regulacja kontrastu
- **Saturation** (-90% do +100%) - Regulacja nasycenia kolorów
- **Gamma** (0.1 do 3.0) - Korekcja gamma
- **Color Temperature** (-100% do +100%) - Regulacja temperatury kolorów (zimny/ciepły)

## 🚀 Instalacja

1. Pobierz folder `Vivideo` z rozszerzeniem
2. Otwórz Chrome/Edge/Opera i przejdź do `chrome://extensions/`
3. Włącz "Developer mode" (Tryb dewelopera)
4. Kliknij "Load unpacked" (Wczytaj rozpakowane)
5. Wybierz folder `Vivideo`

## 📋 Użytkowanie

### Podstawowe sterowanie:
- **Alt + V** - Przełącza widoczność panelu kontrolnego
- **Przeciągnij nagłówek** - Przesuwa panel w inne miejsce
- **Kliknij X** - Zamyka panel

### Regulacja parametrów:
- **Suwaki** - Przeciągnij aby zmienić wartość
- **Pola tekstowe** - Wpisz dokładną wartość
- **Reset All** - Przywraca wszystkie ustawienia do domyślnych

## 🎯 Domyślne wartości

Wszystkie parametry mają domyślną wartość 0 (lub 1.0 dla gamma), co oznacza brak modyfikacji oryginalnego obrazu.

## 🔧 Oczekiwane zachowanie

- **Brightness -50%** → Video ciemniejsze
- **Brightness +50%** → Video jaśniejsze  
- **Contrast -50%** → Płaski obraz, mniejszy kontrast
- **Contrast +50%** → Zwiększony kontrast
- **Saturation -90%** → Prawie czarno-biały obraz
- **Saturation +72%** → Bardzo żywe, nasycone kolory
- **Gamma 0.5** → Ciemniejsze średnie tony
- **Gamma 2.0** → Jaśniejsze średnie tony
- **Color Temp -50%** → Chłodny/niebieski odcień
- **Color Temp +50%** → Ciepły/żółty odcień

## 🌐 Kompatybilność

- ✅ YouTube
- ✅ Vimeo  
- ✅ Netflix
- ✅ Twitch
- ✅ Facebook Video
- ✅ Instagram
- ✅ TikTok
- ✅ Wszystkie strony z elementami `<video>`

## 🎥 Testowanie

Otwórz plik `test.html` w przeglądarce aby przetestować wszystkie funkcje rozszerzenia.

## 🔄 Funkcje zaawansowane

- **Działanie w czasie rzeczywistym** - Wszystkie zmiany są natychmiast widoczne
- **Kompatybilność z pełnym ekranem** - Panel działa nawet w trybie pełnoekranowym
- **Automatyczne wykrywanie wideo** - Rozszerzenie automatycznie znajduje wszystkie elementy video na stronie
- **Shadow DOM support** - Działa z zaawansowanymi komponentami web
- **Pamięć ustawień** - Ustawienia są zachowywane między sesjami

## 📁 Struktura plików

```
Vivideo/
├── manifest.json      # Konfiguracja rozszerzenia
├── background.js      # Service worker
├── content.js         # Główna logika rozszerzenia
├── styles.css         # Style interfejsu
├── popup.html         # Interfejs popup
├── popup.js           # Logika popup
├── test.html          # Strona testowa
└── README.md          # Ten plik
```

## 🛠️ Rozwój

Rozszerzenie zostało stworzone z myślą o prostocie i wydajności. Używa:
- CSS filters dla podstawowych efektów
- SVG filters dla korekcji gamma
- Chrome Extension API v3
- Nowoczesny JavaScript (ES6+)

## 🐛 Rozwiązywanie problemów

1. **Panel nie pojawia się** - Sprawdź czy rozszerzenie jest aktywne w `chrome://extensions/`
2. **Efekty nie działają** - Upewnij się że na stronie są elementy `<video>`
3. **Ustawienia nie zachowują się** - Sprawdź uprawnienia do storage w konsoli

## 📝 Licencja

Ten projekt jest licencjonowany na warunkach MIT License.
