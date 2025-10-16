async function generateJsonData() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const sheetName = 'available';
  // Открываем таблицу с обработкой ошибок
  let spreadsheet, sheet;
  try {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error('Sheet not found');
  } catch (e) {
    Logger.log('Error accessing spreadsheet: ' + e.message);
    return;
  }

  const firstRow = 2;
  const firstColumn = 2;
  let bruttoData = sheet.getRange(firstRow, firstColumn, sheet.getLastRow() - firstRow + 1, sheet.getLastColumn() - firstColumn + 1).getValues();  // Получаем данные из таблицы

  //получаем последнюю строку с ID
  const lastRowWithID = bruttoData.findLastIndex((val) => (typeof val[0] === 'string' && val[0].length > 0));
  Logger.log("рядов - " + (lastRowWithID+1));
  //получаем последнюю колонку с датой
  const lastColWithDate = bruttoData[0].findLastIndex((val) => (val instanceof Date && !isNaN(val)));
  Logger.log("колонок - " + (lastColWithDate+1));
  // Получаем обрезанные данные
  const data = bruttoData.slice(0, lastRowWithID+1).map((row) => row.slice(0,lastColWithDate+1));

  holidayCache = await loadRequiredHolidays(data);

  let css = HtmlService.createHtmlOutputFromFile('style').getContent(); //добавляем стили

  css = css
  .replace(/\/\*[\s\S]*?\*\//g, '') // Удалить комментарии
  .replace(/\s+/g, ' ')             // Заменить множественные пробелы на один
//  .replace(/\s*([{}:;,])\s*/g, '$1') // Удалить пробелы вокруг спецсимволов
  .replace(/;}/g, '}');             // Удалить точку с запятой перед }

  // Пишем всё в JSON
  const jsonData = {
    holiday: holidayCache,
    house: data.slice(1).map((row_n) => row_n[0]),
    date: data[0].slice(1),
    cells: data.slice(1).map((row_n) => row_n.slice(1)),
    style: css
  };

  saveFileToDrive(JSON.stringify(jsonData), "json_back.txt");
  return jsonData;
}