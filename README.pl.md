# Widget Kalendarza Dostępności
📘 **Języki:**  
[🇷🇺 Rosyjski](README.md) | [🇬🇧 Angielski](README.en.md) | [🇵🇱 Polski](README.pl.md)

![Zrzut ekranu](Screenshot_202510.png)

*Interaktywny kalendarz dostępności do rezerwacji domów na luga.by*

Interaktywny widget wyświetlający dostępność domów/pokoi na stronie internetowej. Integruje się z Google Sheets, Google Apps Script i WuBook/Zak API (PMS dla hoteli). Pokazuje daty, status (dostępne/zajęte) i umożliwia wybór zakresów dat rezerwacji.

## Funkcje 🚀

- Dynamiczna tabela dostępności z wizualnymi wskaźnikami.
- Wykrywanie świąt i weekendów (API Nager.Date).
- Interaktywny wybór dat przyjazdu/wyjazdu z walidacją.
- Niestandardowe style dla specjalnych okresów.
- Buforowanie danych (Google CacheService, Drive).
- Integracja z API (zrealizowana dla WuBook/Zak).
- Responsywny design (CSS, poziomy przewijanie).
- Tryb testowy z predefiniowanymi danymi.

## Demo 📺

- **Live Demo**: [example.html](https://htosci.github.io/availibl_widget/example.html).

## Wymagania 🛠️

- Konto Google (Apps Script, Sheets).
- Klucze API: Nager.Date (darmowe), WuBook/Zak.

## Instalacja 📋

### 1. Google Sheets
1. Utwórz arkusz kalkulacyjny, nazwij arkusz `available`.
2. Struktura:
   - Wiersz 2: Daty do wyświetlenia (od kolumny C, `DD.MM.YYYY`).
   - Kolumna A: ID domów w ZakAPI (od wiersza 3).
   - Kolumna B: Nazwy domów.
   - Reszta: `TRUE`/`FALSE` (wypełniane przez skrypt).
3. Zapisz `SPREADSHEET_ID` (z URL).

### 2. Google Apps Script
1. Utwórz projekt w [Apps Script](https://script.google.com).
2. Skopiuj pliki: `Avail_vidget.js`, `json_creator.js`, `json_creator_utility.js`, `zag_to_table.js`, `zag_to_table_utility.js`, `utility.js`, `test_data_json.js`, `style.html` (zmień nazwę z .css).
3. Ustaw `SPREADSHEET_ID` i `ZAG_API_KEY` w PropertiesService.
4. Wdróż jako Web App: `Deploy > Web app > Execute as: Me > Access: Anyone`.
5. Skopiuj `APP_SCRIPT_URL`.

### 3. Frontend
1. Skopiuj: `script_to_site.js`.
2. Dodaj do HTML:
   ```html
   <div id="appscript-widget-container"></div>
   <script src="script_to_site.js"></script>
   ```
3. Ustaw `APP_SCRIPT_URL` w `script_to_site.js`.

### 4. Testowanie
- Uruchom `UpdateTableFromZAG()` w Apps Script.
- Uruchom `updateCacheAndFile()` w utility.
- Otwórz `your.html`.

### 5. Automatyzacja
- Wyzwalacz w Apps Script: `Triggers > Add Trigger > UpdateTableFromZAG > Hourly`.

## Użycie 🔧

- Widget ładuje się w `<div id="appscript-widget-container">`.
- Wybór dat: Kliknij pierwszą i ostatnią datę → zakres zapisuje się w `selectedRange`.
- Aktualizacja: `updateCacheAndFile()` (ręcznie lub przez wyzwalacz).
- Dostosowanie: Edytuj `style.css` lub `script_to_site.js`.

## Debugowanie ⚠️

- **Błędy API**: Sprawdź klucze i limity.
- **Bufor**: Wyczyść przez `clearHolidayCache()`.
- **Strefa czasowa**: Użyj `Europe/Minsk` w formatach.
- **Logi**: Sprawdzaj przez `Logger.log()`.

## Licencja 📄

Licencja MIT.

## Autor 👨‍💻

## Autor
Rozwinięte w ramach projektu [luga.by](https://luga.by).  
Architektura, logika i design autorstwa @htosci.