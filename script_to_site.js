window.addEventListener('DOMContentLoaded', loadWidget);
//const APP_SCRIPT_URL = window.APP_SCRIPT_URL || "https://script.google.com/macros/s/PLACEHOLDER_FOR_LOCAL_DEV/exec";

console.log("APP_SCRIPT_URL = ", APP_SCRIPT_URL);
async function loadWidget() {
    try {
        // Используем нашу переменную APP_SCRIPT_URL
        const url = APP_SCRIPT_URL; 
        const params = new URLSearchParams({
            type: "json-all",
        });
        let data;
        if (url === "test") {
            data = TEST_DATA_JSON;
        }else{
            const response = await fetch(`${url}?${params}`);
            if (!response.ok) throw new Error("Network error: " + response.status);
            data = await response.json();
        }

        const jsonData = data.jsonData;
        if (!jsonData || !jsonData.date || !jsonData.house || !jsonData.cells || !jsonData.holiday || !jsonData.style) {
            throw new Error("Invalid data structure");
        }

        jsonData.date = jsonData.date.map((dateString) => new Date(dateString));
        
        const tableHTML = generateTableFromJson(jsonData);
        
        const container = document.createElement('div');
        container.className = 'available-container';
        container.appendChild(tableHTML);    
        
        const styleElement = document.createElement('style');
        styleElement.textContent = jsonData.style;
        document.head.appendChild(styleElement);
        
        document.getElementById('appscript-widget-container').appendChild(container);
        
        setupTableInteractions(jsonData.date);
    } catch (error) {
        console.error("Loading vidget error: ", error);
        document.getElementById('appscript-widget-container').innerHTML = 
            "Не удалось загрузить таблицу";
    }
}

// Общие форматеры (создаём один раз)
const weekdayFormat = new Intl.DateTimeFormat('ru-BY', {
    timeZone: 'Europe/Minsk',
    weekday: 'short'
});
const dateISOFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Minsk',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});
const monthFormat = new Intl.DateTimeFormat('ru-BY', {
    month: 'long',
    timeZone: 'Europe/Minsk'
});
const dayNumberFormat = new Intl.DateTimeFormat('ru-BY', {
    day: "2-digit",
    timeZone: 'Europe/Minsk'
});

function isWorkDay(date, holidaySet) {
    const weekday = weekdayFormat.format(date);
    const dateString = dateISOFormat.format(date).replace(/\//g, '-');
    const isHoliday = holidaySet && holidaySet.has(dateString);
    return !(weekday === 'сб' || weekday === 'вс' || isHoliday);
}

function isSpecialDate(date) {
    const weekday = weekdayFormat.format(date);
    const isInPeriod = isDateInPeriods(date);
    return !(weekday === 'чт' || weekday === 'пт' || weekday === 'сб'|| weekday === 'вс' || !isInPeriod);
}

function isDateInPeriods(targetDate) {
    
    // --- Шаг 1: Получаем месяц и день проверяемой даты ---
    // Месяцы в JS нумеруются с 0 (0 = Январь, 11 = Декабрь)
    const targetMonth = targetDate.getMonth(); 
    const targetDay = targetDate.getDate();

    // --- Шаг 2: Определяем границы периодов ---
    
    // Период 1: с 10 ноября по 24 декабря (включая переход через год)
    // Ноябрь (10) 10-24
    const P1_START_MONTH = 10; // Ноябрь
    const P1_START_DAY = 10;
    
    // Декабрь (11) 24
    const P1_END_MONTH = 11; // Декабрь
    const P1_END_DAY = 24; 

    // Период 2: с 11 января по 1 марта
    // Январь (0) 11-1
    const P2_START_MONTH = 0; // Январь
    const P2_START_DAY = 11;
    
    // Март (2) 1
    const P2_END_MONTH = 2; // Март
    const P2_END_DAY = 1; 

    // --- Шаг 3: Вспомогательная функция для сравнения дат ---
    // Возвращает числовой код ММДД для сравнения (например, 1110 для 10 ноября)
    const getMonthDayCode = (month, day) => month * 100 + day;

    // Получаем код для проверяемой даты
    const targetCode = getMonthDayCode(targetMonth, targetDay);
    
    // --- Шаг 4: Проверка первого периода (10 ноября - 24 декабря) ---
    const P1_START_CODE = getMonthDayCode(P1_START_MONTH, P1_START_DAY); // 1010
    const P1_END_CODE = getMonthDayCode(P1_END_MONTH, P1_END_DAY);       // 1124

    const isInPeriod1 = (targetCode >= P1_START_CODE && targetCode <= P1_END_CODE);

    // --- Шаг 5: Проверка второго периода (11 января - 1 марта) ---
    const P2_START_CODE = getMonthDayCode(P2_START_MONTH, P2_START_DAY); // 0011
    const P2_END_CODE = getMonthDayCode(P2_END_MONTH, P2_END_DAY);       // 2001

    const isInPeriod2 = (targetCode >= P2_START_CODE && targetCode <= P2_END_CODE);

    // Если дата попадает в любой из периодов, возвращаем true
    return isInPeriod1 || isInPeriod2;
}

function generateTableFromJson(jsonData) {
    const table = document.createElement('table');
    table.id = 'available';
    table.className = 'available';

    const holidaySet = new Set(jsonData.holiday || []);

    // ---- months row (with colspan logic) ----
    const monthRow = document.createElement('tr');
    const yestorday = new Date(jsonData.date[0]);
    yestorday.setDate(yestorday.getDate() - 1);
    let currentMonth = monthFormat.format(yestorday);
    let monthStartCol = -1;

    for (let i = 0; i < jsonData.date.length; i++) {
        const isLastColumn = i === jsonData.date.length - 1;
        const date = jsonData.date[i];
        const month = monthFormat.format(date);

        if (month !== currentMonth || isLastColumn) {
            if (currentMonth !== null) {
                const colspan = i - monthStartCol + (isLastColumn ? 1 : 0);
                const th = document.createElement('th');
                th.colSpan = colspan;
                th.className = 'month';

                const div = document.createElement('div');
                div.className = 'month-text';
                div.textContent = currentMonth;

                th.appendChild(div);
                monthRow.appendChild(th);
            }
            if (!isLastColumn) {
                currentMonth = month;
                monthStartCol = i;
            }
        }
    }
    table.appendChild(monthRow);

    // ---- weekday row ----
    const weekdayRow = document.createElement('tr');
    weekdayRow.className = 'weekday';
    const cornerWdTh = document.createElement('th');
    cornerWdTh.className = 'room-name weekday';
    const contentDivWd = document.createElement('div');
    contentDivWd.className = 'content';
    const bgDivWd = document.createElement('div');
    bgDivWd.className = 'bg';
    cornerWdTh.appendChild(bgDivWd);
    cornerWdTh.appendChild(contentDivWd);
    weekdayRow.appendChild(cornerWdTh);



    for (let i = 0; i < jsonData.date.length; i++) {
        const date = jsonData.date[i];
        const weekday = weekdayFormat.format(date);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        const bgDiv = document.createElement('div');
        bgDiv.className = 'bg';
        const th = document.createElement('th');
        th.className = isWorkDay(date, holidaySet) ? 'weekday' : 'weekday not-work';
        isSpecialDate(date)
            ? th.classList.add('special')
            : th.classList.remove('special');

        contentDiv.textContent = (weekday === 'сб' || weekday === 'вс') ? weekday : " ";
        th.appendChild(bgDiv);
        th.appendChild(contentDiv);
        weekdayRow.appendChild(th);
    }
    table.appendChild(weekdayRow);

    // ---- date row ----
    const dateRow = document.createElement('tr');
    const cornerTh = document.createElement('th');
    cornerTh.className = 'room-name date';
    const whiteBox = document.createElement('div');
    whiteBox.className = 'white-box';
    const contentDivD = document.createElement('div');
    contentDivD.className = 'content';
    const bgDivD = document.createElement('div');
    bgDivD.className = 'bg';
    contentDivD.appendChild(whiteBox);
    cornerTh.appendChild(bgDivD);
    cornerTh.appendChild(contentDivD);
    dateRow.appendChild(cornerTh);

    for (let i = 0; i < jsonData.date.length; i++) {
        const date = jsonData.date[i];
        const day = dayNumberFormat.format(date);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        const bgDiv = document.createElement('div');
        bgDiv.className = 'bg';

        const th = document.createElement('th');
        th.className = isWorkDay(date, holidaySet) ? 'date' : 'date not-work';
        isSpecialDate(date)
            ? th.classList.add('special')
            : th.classList.remove('special');

        contentDiv.textContent = day;
        th.appendChild(bgDiv);
        th.appendChild(contentDiv);
        dateRow.appendChild(th);
    }
    table.appendChild(dateRow);

    // ---- avail rows  ----
    for (let row_i = 0; row_i < jsonData.house.length; row_i++) {
        const row = document.createElement('tr');
        
        const roomTh = document.createElement('th');
        roomTh.className = 'room-name';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        const bgDiv = document.createElement('div');
        bgDiv.className = 'bg';
        contentDiv.textContent = jsonData.house[row_i];
        roomTh.appendChild(bgDiv);
        roomTh.appendChild(contentDiv);
        row.appendChild(roomTh);

        for (let col_i = 0; col_i < jsonData.date.length; col_i++) {
            const contentDiv = document.createElement('div');
            contentDiv.className = 'content';
            const bgDiv = document.createElement('div');
            bgDiv.className = 'bg';
            const date = jsonData.date[col_i];
            const value = jsonData.cells[row_i][col_i];
            const availabilityClass = `aval-${value.toString().replace(/\s+/g, '-').toLowerCase()}`;
            const td = document.createElement('td');
            td.className = isWorkDay(date, holidaySet) ? availabilityClass : `${availabilityClass} not-work`;
            isSpecialDate(date)
                ? td.classList.add('special')
                : td.classList.remove('special');

            td.appendChild(bgDiv);
            td.appendChild(contentDiv);

            row.appendChild(td);
        }

        table.appendChild(row);
    }

  return table;
}


function setupTableInteractions(dates) {
    const minskDateFormat = new Intl.DateTimeFormat('ru-BY', {
        timeZone: 'Europe/Minsk',
      });
    const table = document.getElementById('available');
    if (!table) {
        console.error('Table not found');
        return;
    }
    
    const availableCells = table.querySelectorAll('.aval-true, .aval-true + td.aval-false');
    let firstSelectedCell = null;
    let selectedRange = {
        datein: null,
        dateout: null,
        house: null
    };


    availableCells.forEach(cell => {
        cell.addEventListener('mouseenter', handleCellMouseEnter);
        cell.addEventListener('mouseleave', handleCellMouseLeave);
        cell.addEventListener('click', handleCellClick);
    });

    function handleCellMouseEnter() {
        clearHighlights();
        const row = this.parentElement;
        row.cells[0].classList.add('highlight');
        const colIndex = getCellColumnIndex(this);
        table.rows[2].cells[colIndex].classList.add('highlight');
    }

    function handleCellMouseLeave() {
        clearHighlights();
    }

    function handleCellClick() {
        if (!firstSelectedCell) {
            resetSelection();
            firstSelectedCell = this;
            this.classList.add('range');
            this.querySelector('.content').style.setProperty('--date', '"'+getDateFromHeader(this)+'"');
        } else {
            this.classList.add('range');
            this.querySelector('.content').style.setProperty('--date', '"'+getDateFromHeader(this)+'"');
            const startCell = firstSelectedCell;
            const endCell = this;
            const isSameRow = startCell.parentElement === endCell.parentElement;
            const [startIndex, endIndex] = sortRangeIndices(getCellColumnIndex(startCell), getCellColumnIndex(endCell));
            
            if (isSameRow && isValidRange(startCell.parentElement, startIndex, endIndex)) {
                selectValidRange(startCell.parentElement, startIndex, endIndex);
                saveSelection(startCell.parentElement, startIndex, endIndex);
            } else {
                resetSelection();
            }
            firstSelectedCell = null;
        }
    }

    function getCellColumnIndex(cell) {
        return Array.from(cell.parentElement.cells).indexOf(cell);
    }

    function getDateFromHeader(cell) {
        const colIndex = getCellColumnIndex(cell);
        return table.rows[2].cells[colIndex].textContent;
    }

    function sortRangeIndices(start, end) {
        return start < end ? [start, end] : [end, start];
    }

    function isValidRange(row, startIndex, endIndex) {
        if (startIndex === endIndex){
            return false;
        }        
        for (let i = startIndex; i < endIndex; i++) {
            if (!row.cells[i].classList.contains('aval-true')) {
                return false;
            }
        }
        return true;
    }

    function selectValidRange(row, startIndex, endIndex) {
        for (let i = startIndex; i <= endIndex; i++) {
            row.cells[i].classList.add('range');
        }
        row.cells[startIndex].classList.add('range-start');
        row.cells[endIndex].classList.add('range-end');
    }

    function saveSelection(row, startIndex, endIndex) {
        selectedRange = {
            datein: minskDateFormat.format(dates[startIndex-1]),
            dateout: minskDateFormat.format(dates[endIndex-1]),
            house: 'дом №' + row.cells[0].textContent.slice(4)
        };
        console.log('Selected range:', selectedRange);

        Object.keys(selectedRange).forEach((key) => {
            const value = selectedRange[key];
            if (value) {
                const element = document.querySelector(`[name="${key}"]`);
                if (element) {
                    element.value = value;
                }
            }
        });
    }

    function resetSelection() {
        document.querySelectorAll('.range').forEach(cell => {
            cell.classList.remove('range', 'range-start', 'range-end');
            cell.querySelector('.content').style.setProperty('--date', '""');
        });
        selectedRange = {
            datein: null,
            dateout: null,
            house: null
        };
    }

    function clearHighlights() {
        document.querySelectorAll('.highlight').forEach(el => {
            el.classList.remove('highlight');
        });
    }
}