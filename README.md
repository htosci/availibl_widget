# Availability Calendar Widget
📘 **Languages:**
[🇷🇺 Русский](README.md) | [🇬🇧 English](README.en.md) | [🇵🇱 Polski](README.pl.md)

![скриншот](Screenshot_202510.png)

*Интерактивный календарь доступности для бронирования домов на сайте luga.by*

Интерактивный виджет для отображения доступности домов/номеров на сайте. Интегрируется с Google Sheets, Google Apps Script и WuBook/Zak API (PMS для отелей). Показывает даты, статус (свободно/занято), позволяет выбирать диапазоны для бронирования.

## Функции 🚀

- Динамическая таблица доступности с визуальными индикаторами.
- Учет праздников (API Nager.Date) и выходных.
- Интерактивный выбор дат заезда/выезда с валидацией.
- Специальные периоды с кастомной стилизацией.
- Кэширование данных (Google CacheService, Drive).
- Интеграция с API (реализована для WuBook/Zak).
- Адаптивный дизайн (CSS, горизонтальный скролл).
- Тестовый режим с предустановленными данными.

## Демо 📺

- **Живое демо**: [example.html](https://htosci.github.io/availibl_widget/example.html).

## Требования 🛠️

- Google Account (Apps Script, Sheets).
- API ключи: Nager.Date (бесплатный), WuBook/Zak.

## Установка 📋

### 1. Google Sheets
1. Создайте таблицу, лист `available`.
2. Структура:
   - Строка 2: Даты для отображения(с колонки C, `DD.MM.YYYY`).
   - Колонка A: ID домов в ZakAPI(с 3-й строки).
   - Колонка B: Названия домов.
   - Остальное: `TRUE`/`FALSE` (заполняется скриптом).
3. Сохраните `SPREADSHEET_ID` (из URL).

### 2. Google Apps Script
1. Создайте проект в [Apps Script](https://script.google.com).
2. Скопируйте файлы: `Avail_vidget.js`, `json_creator.js`, `json_creator_utility.js`, `zag_to_table.js`, `zag_to_table_utility.js`, `utility.js`, `test_data_json.js`, `style.html`(переименовать из .css).
3. Укажите `SPREADSHEET_ID` и `ZAG_API_KEY` в PropertiesService.
4. Опубликуйте как Web App: `Deploy > Web app > Execute as: Me > Access: Anyone`.
5. Скопируйте `APP_SCRIPT_URL`.

### 3. Frontend
1. Скопируйте: `script_to_site.js`.
2. Добавьте в HTML:
   ```html
   <div id="appscript-widget-container"></div>
   <script src="script_to_site.js"></script>
   ```
3. Укажите `APP_SCRIPT_URL` в `script_to_site.js`.

### 4. Тестирование
- Запустите `UpdateTableFromZAG()` в Apps Script.
- Запустите `updateCacheAndFile()` в utility.
- Откройте `your.html`.

### 5. Автоматизация
- Триггер в Apps Script: `Triggers > Add Trigger > UpdateTableFromZAG > Hourly`.

## Использование 🔧

- Виджет загружается в `<div id="appscript-widget-container">`.
- Выбор дат: Клик на первую и последнюю дату → диапазон сохраняется в `selectedRange`.
- Обновление: `updateCacheAndFile()` (вручную или по триггеру).
- Кастомизация: Редактируйте `style.css` или `script_to_site.js`.

## Отладка ⚠️

- **API ошибки**: Проверьте ключи и лимиты.
- **Кэш**: Очистите через `clearHolidayCache()`.
- **Часовой пояс**: Используйте `Europe/Minsk` в форматтерах.
- **Логи**: Проверяйте через `Logger.log()`.

## Лицензия 📄

MIT License.

## Автор 👨‍💻

## Автор
Разработано в рамках проекта [luga.by](https://luga.by).  
Архитектура, логика и дизайн — @htosci.