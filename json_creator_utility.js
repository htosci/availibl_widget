let holidayCache = [];


// загружаем список рабочих дней в глобальную переменну, на основании данных из таблицы(где первая строка это даты)
async function loadRequiredHolidays(data) {
  const years = new Set();
  // Собираем уникальные года из первой строки данных
  for (let col_i = 1; col_i < data[0].length; col_i++) {
    const date = new Date(data[0][col_i]);
    if (!isNaN(date)) { // Проверка на валидность даты
      years.add(date.getFullYear());
    }
  }
  // Загружаем праздники для всех годов параллельно
  const results = await Promise.all(
    Array.from(years).map(year => loadHolidaysForYear(year))
  );
  // Возвращаем плоский массив всех дат праздников
  return results.flat().map(holiday => holiday.date);
}


// Асинхронная версия загрузки праздников с кэшированием в Properties
async function loadHolidaysForYear(year) {
  const cacheKey = `holidays_${year}`;
  const props = PropertiesService.getScriptProperties();
  // Проверяем кэш
  const cached = props.getProperty(cacheKey);
  if (cached) {
    Logger.log(`Данные за ${year} загружены из кэша`);
    return JSON.parse(cached);
  }
  try {
    // Загрузка из API
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/BY`;
    const response = await UrlFetchApp.fetch(url);
    const holidays = JSON.parse(response.getContentText());
    // Сохраняем в кэш
    props.setProperty(cacheKey, JSON.stringify(holidays));
    Logger.log(`Данные за ${year} загружены из API`);
    return holidays;
  } catch (error) {
    console.error(`Ошибка загрузки для ${year}:`, error);
    return []; // Возвращаем пустой массив при ошибке
  }
}
