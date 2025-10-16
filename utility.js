function getCachedData(fileName = "vidget.json"){
  const cache = CacheService.getScriptCache();
  let cachedPage = cache.get(fileName);

  if (!cachedPage) {
    Logger.log("❌ Данных " + fileName + " в кэше нет, берём из Google Drive...");
    cachedPage = loadFileFromDrive(fileName);
    // Запускаем updateCacheAndFile() в фоновом режиме через триггер
    const trigger = ScriptApp.newTrigger("updateCacheAndFile")
      .timeBased()
      .after(7000) // Запуск через .. мс
      .create();

    addTriggerToIds(trigger.getUniqueId());
    Logger.log(`trigger создан ID: ${trigger.getUniqueId()}`);
  } else {
    Logger.log("✅ Загрузили виджет из кэша");
  }

  Logger.log(`getCachedData() получил ${fileName} ${cachedPage.slice(0,100)} ...`);
  return cachedPage;
}

function addTriggerToIds(id) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('TRIGGER_IDS') || '[]';
  const ids = JSON.parse(raw);
  ids.push(id);
  props.setProperty('TRIGGER_IDS', JSON.stringify(ids));
}

function removeAllTriggersInIDs() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('TRIGGER_IDS');
  if (!raw) return;

  const storedIds = new Set(JSON.parse(raw));
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log(`триггеры из IDs: ${JSON.stringify(Array.from(storedIds))}`);

  for (const trigger of triggers) {
    const id = trigger.getUniqueId();
    if (storedIds.has(id)) {
      Logger.log(`Удаляем триггер ID: ${id}`);
      ScriptApp.deleteTrigger(trigger);
      storedIds.delete(id);
    }
  }

Logger.log(" в IDs отсталось: " + JSON.stringify(Array.from(storedIds)));

  props.setProperty('TRIGGER_IDS', JSON.stringify(Array.from(storedIds)));
}

// Функция для обновления данных ZAG - генерацыи HTML/JSON и сохранения HTML/JSON в кеш
async function updateCacheAndFile() {
  const fileName = "vidget.json";
  Logger.log(`updateCacheAndFile(${fileName} (должно быть = "vidget.json") )`);
  removeAllTriggersInIDs();
  
  const lock = LockService.getScriptLock();
  if (lock.tryLock(0)) {
    try {
      // Здесь размещаем код, который не должен выполняться параллельно
//      UpdateTableFromZAG();
      Logger.log(" UpdateTableFromZAG() прошел");
              const jsondata = await generateJsonData();
              const jsonString = JSON.stringify(jsondata);
              Logger.log("JSON создан.");
              saveDataToCacheAndFile(jsonString, fileName);
    } finally {
      lock.releaseLock();
    }
  } else {
    Logger.log("🔸 Функция updateCacheAndFile() уже выполняется ==>> пропускаем!");
  }
}
 

function saveDataToCacheAndFile(data, fileName){
  Logger.log(`saveDataToCacheAndFile(${data.slice(0,50)}, ${fileName} (должно быть = "vidget.json") )`);
  const cache = CacheService.getScriptCache();
  try {
    cache.put(fileName, data, 7200); // Пытаемся записать // в секундах
    const cachedValue = cache.get(fileName); // Сразу читаем обратно
    if (cachedValue === data) {
      Logger.log("✅ Данные успешно записаны в кэш! key: " + fileName);
    } else {
      Logger.log("❌ Данные не попали в кэш (возможно, истёк TTL или кэш переполнен). key: " + fileName);
    }
  } catch (e) {
    Logger.log("⚠️ Ошибка при работе с кэшем: " + e.message);
  }
  saveFileToDrive(data, fileName);
}

// чистим holiday
function clearHolidayCache() { 
  const prop = PropertiesService.getScriptProperties();
  const keys = prop.getKeys();
  keys.forEach((key) => {if (key.startsWith('holidays')){ prop.deleteProperty('holidays')}});
  console.log("Holiday кэш в PropertiesService был очищен");
}


function saveFileToDrive(data, fileName) {
  Logger.log(`saveFileToDrive(${data.slice(0,50)}, ${fileName} (должно быть = "vidget.json") )`);
  const files = DriveApp.getFilesByName(fileName);
  const file = files.hasNext() ? files.next().setContent(data) : DriveApp.createFile(fileName, data, MimeType.PLAIN_TEXT);
  if (file) {
    Logger.log(file.getName() + " сохранён на диск.✅" + " размер " + file.getSize());
    Logger.log("создан " + file.getDateCreated() + "изменён " + file.getLastUpdated());
  }else Logger.log("Не вышло сохранить ❌" + fileName + " на диск! Что-то пошло не так!");
  return file.getId();
}


function loadFileFromDrive(fileName) {
  const files = DriveApp.getFilesByName(fileName);
  let result = files.hasNext() ? files.next().getBlob().getDataAsString() : 'File not found';
  Logger.log(fileName + " загружен с диска.");
  return result;
}