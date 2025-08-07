# 🔧 Vivideo Shortcut Fix - Rozwiązanie problemu skrótów klawiszowych

## 🐛 Problem:
Skrót klawiszowy `Alt+V` nie działał domyślnie. Użytkownik musiał:
1. Wejść w `chrome://extensions/shortcuts`
2. Zmienić `Toggle Vivideo controls` na inny skrót
3. Wtedy dopiero `Alt+V` zaczynał działać (ale nie ustawiony przez użytkownika skrót)

## 🔍 Przyczyna:
Konflikt między trzema metodami obsługi skrótów:
1. **Chrome Commands API** (manifest.json + background.js)
2. **Direct keyboard event listener** (content script)  
3. **Message passing** (background → content script)

Problem polegał na tym, że:
- Gdy użytkownik nie ustawił własnego skrótu, Commands API nie było aktywowane
- Direct listener działał poprawnie
- Po ustawieniu własnego skrótu, Commands API się aktywowało i konfliktowało z direct listenerem
- Message passing działał niezależnie, powodując dodatkowe wywołania

## ✅ Rozwiązanie:

### 1. **Usunięto suggested_key z manifest.json**
```json
// PRZED:
"commands": {
  "toggle-vivideo": {
    "suggested_key": {
      "default": "Alt+V"
    },
    "description": "Toggle Vivideo controls"
  }
}

// PO:
"commands": {
  "toggle-vivideo": {
    "description": "Toggle Vivideo controls"
  }
}
```

### 2. **Inteligentne wykrywanie ustawień użytkownika**
```javascript
// Variable to track if we should handle keyboard shortcuts directly
let shouldHandleKeyboardShortcuts = true;

// Check if user has set custom shortcuts
if (chrome && chrome.commands) {
  chrome.commands.getAll((commands) => {
    const toggleCommand = commands.find(cmd => cmd.name === 'toggle-vivideo');
    if (toggleCommand && toggleCommand.shortcut && toggleCommand.shortcut !== '') {
      console.log('Vivideo: User has custom shortcut:', toggleCommand.shortcut);
      shouldHandleKeyboardShortcuts = false; // Let Chrome handle it
    } else {
      console.log('Vivideo: Using default Alt+V shortcut handling');
      shouldHandleKeyboardShortcuts = true; // Handle it ourselves
    }
  });
}
```

### 3. **Warunkowy direct keyboard listener**
```javascript
// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Only handle keyboard shortcut if user hasn't set a custom one
  if (shouldHandleKeyboardShortcuts && e.altKey && e.key === 'v') {
    e.preventDefault();
    e.stopPropagation();
    console.log('Vivideo: Alt+V keyboard shortcut detected (direct handling)');
    // ... toggle logic
  }
});
```

### 4. **Lepsze message handling**
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Vivideo Content: Message received:', request);
  if (request.action === 'toggle-vivideo') {
    // Add small delay to prevent conflict with direct keyboard listener
    setTimeout(() => {
      // ... toggle logic
    }, 10);
    sendResponse({ success: true });
  }
  return true;
});
```

### 5. **Usunięto duplikowany message listener**
- Usunięto listener z metody `bindEvents()` 
- Pozostawiono tylko główny listener na końcu pliku

### 6. **Dodano lepsze debugowanie**
```javascript
toggle() {
  console.log('Vivideo: Toggle called, isVisible:', this.isVisible, 'timestamp:', Date.now());
  // ...
}
```

## 🎯 Rezultat:

### Scenariusz 1: Domyślne użytkowanie
- ✅ `Alt+V` działa od razu po instalacji
- ✅ Brak konieczności konfiguracji
- ✅ W `chrome://extensions/shortcuts` widnieje "Not set"

### Scenariusz 2: Użytkownik ustawia własny skrót
- ✅ Własny skrót (np. `Ctrl+Q`) działa poprawnie
- ✅ `Alt+V` przestaje działać (unika konfliktu)
- ✅ Chrome Commands API przejmuje obsługę

### Scenariusz 3: Użytkownik usuwa własny skrót
- ✅ `Alt+V` wraca do działania
- ✅ Direct listener ponownie przejmuje obsługę

## 📁 Zmienione pliki:

1. **`manifest.json`** - Usunięto `suggested_key`
2. **`src/content.js`** - Dodano inteligentne wykrywanie, poprawiono handlery
3. **`background.js`** - Dodano lepsze logowanie
4. **`zorks/shortcut-debug-test.html`** - Plik testowy do debugowania
5. **`zorks/shortcut-quick-test.html`** - Szybki test skrótu

## 🧪 Testowanie:

### Test podstawowy:
1. Naciśnij `Alt+V` - rozszerzenie powinno się przełączyć
2. Sprawdź konsolę - powinna pokazać "direct handling"

### Test ustawień Chrome:
1. Wejdź w `chrome://extensions/shortcuts`
2. "Toggle Vivideo controls" powinno pokazywać "Not set"
3. Ustaw własny skrót (np. `Ctrl+Q`)
4. Sprawdź czy nowy skrót działa
5. Sprawdź konsolę - powinna pokazać "User has custom shortcut"

### Test plików testowych:
- `zorks/shortcut-debug-test.html` - Pełny debug z konsolą
- `zorks/shortcut-quick-test.html` - Szybki test

## 🔮 Kompatybilność:

- ✅ **Chrome/Chromium** - Pełna kompatybilność
- ✅ **Edge** - Kompatybilne (Chromium-based)
- ✅ **Brave** - Kompatybilne (Chromium-based)
- ❓ **Firefox** - Wymaga testów (inne API)

## 🎉 Podsumowanie:

Problem został rozwiązany przez implementację **hybrydowego systemu obsługi skrótów**, który:

1. **Domyślnie używa direct keyboard listener** dla `Alt+V`
2. **Automatycznie przełącza się na Chrome Commands API** gdy użytkownik ustawi własny skrót
3. **Zapobiega konfliktom** między różnymi metodami obsługi
4. **Zapewnia seamless experience** bez konieczności konfiguracji

**Teraz `Alt+V` działa domyślnie, bez żadnej dodatkowej konfiguracji!** 🎉
