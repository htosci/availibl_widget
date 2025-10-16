function UpdateTableFromZAG() {
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
  const idRow = 3;
  const idColumn = 1;
  const dateRow = 2;
  const dateColumn = 3;
  
  //записываем сегоднешний день
  const todayCell = sheet.getRange('R'+dateRow+'C'+dateColumn);
  todayCell.setValue(new Date());
  Logger.log('записали первыю дату: '+new Date());

  // Получаем данные за один запрос
  const dataRange = sheet.getDataRange();
  const allData = dataRange.getValues();

  // Извлекаем ID номеров (колонка A, начиная с строки 3)
  const idList = allData.slice(idRow-1).map(row => row[idColumn-1]).filter(id => typeof id === 'number');
  if (!idList.length) {
    Logger.log('No valid room IDs found');
    return;
  }
  Logger.log("Номера - " + idList);

  // Извлекаем даты (строка 2, начиная с колонки C)
  const dateList = allData[dateRow-1].slice(dateColumn-1).filter(date => date instanceof Date);
  if (!dateList.length) {
    Logger.log('No valid dates found');
    return;
  }

  Logger.log("Даты - от " + formatDate(dateList[0]) + " до " + formatDate(dateList[dateList.length - 1]));

  const avalArr = getDatesAvailByPart(dateList, idList);
  // Транспонируем и записываем
  if (avalArr.length) {
    const transposedArr = transposeArray(avalArr);
    const outputRange = sheet.getRange(idRow, dateColumn, transposedArr.length, transposedArr[0].length);
    outputRange.setValues(transposedArr);
  }

  updateCacheAndFile();
}

