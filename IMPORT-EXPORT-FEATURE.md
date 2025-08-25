# Vivideo - Import/Export Settings Feature

## 📋 Opis funkcjonalności

Dodano funkcjonalność importu i eksportu ustawień do rozszerzenia Vivideo, która pozwala użytkownikom:
- Eksportować wszystkie ustawienia i profile do pliku JSON
- Importować wcześniej zapisane ustawienia z pliku
- Przywracać kompletne konfiguracje między różnymi instalacjami lub urządzeniami

## 🚀 Dostępne sposoby użycia

### 1. Panel główny Vivideo
- Naciśnij `Alt + V` aby otworzyć panel
- Kliknij przycisk ⚙️ obok przycisku "Profiles"  
- Użyj przycisków "📤 Eksportuj ustawienia" i "📥 Importuj ustawienia"

### 2. Popup rozszerzenia  
- Kliknij ikonę rozszerzenia w pasku narzędzi
- W sekcji "⚙️ Zarządzanie ustawieniami" znajdź przyciski Import/Export
- Funkcjonalność identyczna jak w panelu głównym

## 📄 Format eksportowanych danych

Eksportowane pliki zawierają:
- **Settings**: Wszystkie ustawienia filtrów (brightness, contrast, saturation, gamma, colorTemp, sharpness)  
- **Profiles**: Wszystkie zapisane profile użytkownika z ich ustawieniami
- **Theme**: Aktualny motyw (cybernetic/casual)
- **ThemeColors**: Niestandardowe kolory motywów
- **AppState**: Stan aplikacji
- **Version**: Wersja formatu danych
- **Timestamp**: Data i czas eksportu

Przykład struktury:
```json
{
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "settings": {
    "brightness": 10,
    "contrast": 5,
    "saturation": -5,
    "gamma": 1.2,
    "colorTemp": 15,
    "sharpness": 20,
    "autoActivate": true,
    "workOnImagesActivate": false,
    "activeProfile": "My Profile"
  },
  "profiles": [
    {
      "name": "My Profile", 
      "settings": { /* ustawienia profilu */ }
    }
  ],
  "theme": "cybernetic",
  "themeColors": { /* kolory motywów */ },
  "appState": { /* stan aplikacji */ }
}
```

## 🔧 Implementacja techniczna

### Nowe pliki
- `src/components/settingsManager.js` - główna klasa obsługująca import/export

### Zmodyfikowane pliki  
- `manifest.json` - dodano uprawnienie "downloads"
- `popup.html` - dodano sekcję zarządzania ustawieniami
- `popup.js` - dodano obsługę import/export w popup'ie
- `src/content.js` - integracja SettingsManager z głównym kontrolerem
- `src/components/profileManager.js` - dodano przycisk ⚙️ settings
- `styles.css` - style dla nowych elementów UI

### Klasa SettingsManager

**Główne metody:**
- `exportSettings()` - eksportuje wszystkie dane do pliku JSON
- `importSettings(file)` - importuje dane z wybranego pliku  
- `validateImportData(data)` - waliduje poprawność importowanych danych
- `applyImportedSettings(data)` - aplikuje zaimportowane ustawienia
- `restoreFromBackup()` - przywraca poprzednie ustawienia (backup)

**Funkcje bezpieczeństwa:**
- Walidacja struktury importowanych danych
- Kopia zapasowa przed importem (sessionStorage)
- Obsługa błędów z komunikatami dla użytkownika
- Sprawdzanie wymaganych pól w danych

## ✅ Funkcjonalności

### Eksport
- [x] Eksport wszystkich ustawień filtrów  
- [x] Eksport wszystkich profili użytkownika
- [x] Eksport ustawień motywu i kolorów
- [x] Eksport stanu aplikacji
- [x] Automatyczne nazewnictwo plików z timestamp'em
- [x] Download bezpośrednio przez przeglądarkę
- [x] Komunikaty o powodzeniu/błędzie

### Import
- [x] Import i zastosowanie wszystkich ustawień
- [x] Import i odtworzenie profili użytkownika  
- [x] Import ustawień motywu
- [x] Walidacja poprawności danych
- [x] Kopia zapasowa przed importem
- [x] Odświeżenie interfejsu po imporcie
- [x] Obsługa błędów z komunikatami
- [x] Przywracanie poprzednich ustawień w przypadku błędu

### Interface użytkownika
- [x] Przycisk ⚙️ w sekcji profili (panel główny)
- [x] Sekcja import/export w popup'ie rozszerzenia  
- [x] Animowane komunikaty o statusie operacji
- [x] Responsywny design pasujący do motywów Vivideo
- [x] Informacje o zawartości eksportu
- [x] Wskazówki dla użytkownika

## 🧪 Testowanie

Użyj pliku `test-import-export.html` do przetestowania funkcjonalności:

1. Otwórz plik w przeglądarce
2. Postępuj zgodnie z instrukcjami testowymi
3. Przetestuj różne scenariusze (prawidłowe/nieprawidłowe pliki)
4. Sprawdź czy wszystkie profile i ustawienia są poprawnie przywracane

## 🔄 Aktualizacje manifest.json

Dodano nowe uprawnienia:
```json
{
  "permissions": [
    "storage",
    "activeTab", 
    "scripting",
    "downloads"  // NOWE - do pobierania eksportowanych plików
  ]
}
```

Dodano nowy komponent do content scripts:
```json
{
  "js": [
    // ... inne pliki
    "src/components/settingsManager.js"  // NOWY
  ]
}
```

## 🎯 Przyszłe rozszerzenia

Potencjalne przyszłe funkcjonalności:
- Import/export ustawień przez chmurę (Google Drive, Dropbox)
- Automatyczne backupy ustawień
- Synchronizacja między urządzeniami
- Export tylko wybranych profili
- Import z automatycznym mergowaniem (zamiast zastępowania)
- Historia zmian w ustawieniach

## 📝 Uwagi

- Profile po import/load są w pełni funkcjonalne i przywracają dokładnie poprzednie ustawienia
- Funkcjonalność działa z wszystkimi istniejącymi motywami (cybernetic, casual)
- Import automatycznie odświeża interfejs użytkownika
- Eksportowane pliki są czytelne i można je edytować ręcznie
- Backup przed importem umożliwia cofnięcie zmian
