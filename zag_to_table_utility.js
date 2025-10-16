// Получаем доступность для всех дат из списка по частям
function getDatesAvailByPart(alldateList, allRoomID){
  const partSize = 30;
  const pauseMiliSec = 5000; //5сек
  let responses =[];
  for (let i = 0; i < alldateList.length; i += partSize) {
    const partDateList = alldateList.slice(i,i + partSize);
    responses = responses.concat(multiAvailabilityPostRequest(partDateList));
    // Пауза между пачками
    Logger.log("Отправляем " + (i/partSize) + " пачку запросов");
    if ((i + partSize) < alldateList.length ) {
      Utilities.sleep(pauseMiliSec); 
    }
  }
  return responses.map( (resp) => setAvailForResponse(resp,allRoomID));
}

// Отправка пачки запросов
function multiAvailabilityPostRequest(partDateList){
  const requests = partDateList.map(oneDate => ({
      url: 'https://kapi.wubook.net/kp/inventory/fetch_rooms_availability',
      method: 'post',
      headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key':   PropertiesService.getScriptProperties().getProperty('ZAG_API_KEY')
      },
      payload: jsonToUrlEncoded(getDatePare(oneDate)),
      muteHttpExceptions: true
    })
  );
  try {
    return UrlFetchApp.fetchAll(requests);
  } catch (e) {
    Logger.log('Error in batch: ' + e);
    return [];
  }
}

function getDatePare(date) {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const payload = {
    arrival: formatDate(date),
    departure: formatDate(tomorrow)
  };
  return payload;
}

function setAvailForResponse(response, idList){
    const json = JSON.parse(response.getContentText());
    if (json.error) {
      throw new Error(json.message || 'API error');
    }
    const data = json.data;//объект свободных номеров от ZAK
    const availableRooms = new Set(getFreeRoomsID(data));//список ID свободных номеров
    return idList.map(room => availableRooms.has(room));//список true/false имеються ли в нашем листе номера из ответа
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function jsonToUrlEncoded(dataJson){
  let payload = Object.keys(dataJson)
  .map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(dataJson[key]);
  })
  .join('&');
  return payload; //строка для UrlEncoded в REST
  };

function getFreeRoomsID(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response data');
  }
  return Object.values(data)
    .flatMap(roomType => roomType?.rooms || []);
}

function transposeArray(array) { 
    return array[0].map((_, colIndex) => array.map(row => row[colIndex])); //меняем местами строки и столбцы
}

