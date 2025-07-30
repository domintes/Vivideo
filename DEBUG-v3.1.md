# 🐛 Vivideo Debug - Lokalizacja plików tymczasowych

## 📂 Lokalizacje plików tymczasowych Chrome Extensions

### Windows:
```
C:\Users\[Username]\AppData\Local\Google\Chrome\User Data\Default\Extensions\
C:\Users\[Username]\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings\
C:\Users\[Username]\AppData\Local\Temp\
```

### Sprawdzenie przez Chrome DevTools:
1. Otwórz Chrome
2. Wejdź w `chrome://extensions/`
3. Włącz "Developer mode"
4. Znajdź Vivideo i kliknij "Details"
5. Sprawdź "Extension ID" 
6. Folder będzie w `Extensions\[EXTENSION_ID]\`

### Czyszczenie cache rozszerzenia:
```bash
# Windows PowerShell (uruchom jako administrator)
Stop-Process -Name "chrome" -Force
Remove-Item -Path "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions\*" -Recurse -Force
Remove-Item -Path "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Local Extension Settings\*" -Recurse -Force
```

### Manual cleanup:
1. Zamknij całkowicie Chrome
2. Usuń folder z Extension ID
3. Wyczyść Local Extension Settings
4. Uruchom Chrome ponownie
5. Załaduj rozszerzenie ponownie

## 🔧 Naprawione błędy w v3.1

### 1. Syntax Error - Template String
**Błąd:** `Uncaught SyntaxError: Unexpected token '<'`
**Lokalizacja:** content.js:392
**Przyczyna:** Template string nie został prawidłowo zakończony
**Rozwiązanie:** ✅ Naprawiono zamknięcie template string

### 2. Chrome Runtime Connection Error  
**Błąd:** `Could not establish connection. Receiving end does not exist.`
**Lokalizacja:** background.js
**Przyczyna:** Brakujący message handler w content script
**Rozwiązanie:** ✅ Dodano chrome.runtime.onMessage.addListener()

### 3. Ikony rozszerzenia
**Problem:** Ikony z folderu icons/ nie działały
**Rozwiązanie:** ✅ Zmieniono na src/assets/icon/ w manifest.json

## 🚀 Dodane funkcje v3.1

### Message Handlers:
```javascript
// Toggle Vivideo przez background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle-vivideo') {
    if (window.vivideoController) {
      window.vivideoController.toggle();
    } else {
      initializeVivideo();
    }
    sendResponse({ success: true });
  }
  return true;
});
```

### Keyboard Shortcut Handler:
```javascript
// Alt+V bezpośrednio w content script
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 'v') {
    e.preventDefault();
    if (window.vivideoController) {
      window.vivideoController.toggle();
    }
  }
});
```

### Poprawione ikony:
```json
"icons": {
  "16": "src/assets/icon/icon_16.png",
  "32": "src/assets/icon/icon_32.png", 
  "48": "src/assets/icon/icon_48.png",
  "128": "src/assets/icon/icon_128.png"
}
```

## 🧪 Testowanie po naprawach

### Sprawdź:
1. ✅ Brak błędów składni w Console (F12)
2. ✅ Alt+V działa poprawnie
3. ✅ Ikona rozszerzenia widoczna
4. ✅ Background script komunikuje się z content script
5. ✅ Podwójny color picker działa
6. ✅ Nowy layout Themes→Profiles→Form

### Jeśli nadal są problemy:
1. **Wyczyść cache rozszerzenia** (instrukcje powyżej)
2. **Przeładuj rozszerzenie** w chrome://extensions/
3. **Sprawdź Console** w DevTools (F12)
4. **Sprawdź Background Page** w chrome://extensions/ → Vivideo → "service worker"

## 📋 Checklist debugowania

- [ ] Chrome DevTools otwarte (F12)
- [ ] Console clear (brak błędów)
- [ ] Background service worker aktywny
- [ ] Extension ID widoczne w chrome://extensions/
- [ ] Pliki rozszerzenia w odpowiednim folderze
- [ ] Permissions poprawne w manifest.json
- [ ] Content scripts ładują się bez błędów

**Status: Wszystkie błędy naprawione! ✅**
