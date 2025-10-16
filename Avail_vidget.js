function doGet(e) {
// Получаем все заголовки запроса
  const par = e?.parameter;
  Logger.log(par);
  const vidgetType = e?.parameter.type; // Получаем значение параметра ('type')

  let response;
  if (vidgetType === 'json-all') {  // Основной ответ
    const data = {
      status: 'success',
      vidgetType: vidgetType,
      message: 'full json loaded',
      jsonData: JSON.parse(getCachedData("vidget.json")),
    };
    response = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);


  } else if (vidgetType === 'test'){  // Ответ для test
    const data = {
      status: 'success',
      paramts: par,
      vidgetType: vidgetType,
      message: 'test vidget loaded',
      jsonData: getJsonVidgetTest(),
    };
    response = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);    


  } else {
    const data = {
      status: 'success',
      message: 'no type',
    };
    response = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  }

  return response;
}




