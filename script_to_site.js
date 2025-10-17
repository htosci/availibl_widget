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
function generateTableFromJson(jsonData) {
    const holidaySet = new Set(jsonData.holiday);
    const table = document.createElement('table');
    table.id = 'available';
    table.className = 'available';
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
        day: "2-digit" ,
        timeZone: 'Europe/Minsk' 
      });

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

    const dateRow = document.createElement('tr');
    const cornerTh = document.createElement('th');
    cornerTh.className = 'room-name date';

    const whiteBox = document.createElement('div');
    whiteBox.className = 'white-box';
    cornerTh.appendChild(whiteBox);
    dateRow.appendChild(cornerTh);

    for (let i = 0; i < jsonData.date.length; i++) {
        const date = jsonData.date[i];
        const day = dayNumberFormat.format(date);

        const th = document.createElement('th');
        th.className = isWorkDay(date) ? 'date' : 'date not-work';
        th.textContent = day;

        dateRow.appendChild(th);
    }
    table.appendChild(dateRow);

    for (let row_i = 0; row_i < jsonData.house.length; row_i++) {
        const row = document.createElement('tr');

        const roomTh = document.createElement('th');
        roomTh.className = 'room-name';
        roomTh.textContent = jsonData.house[row_i];
        row.appendChild(roomTh);

        for (let col_i = 0; col_i < jsonData.date.length; col_i++) {
            const date = jsonData.date[col_i];

            const value = jsonData.cells[row_i][col_i];
            const availabilityClass = `aval-${value.toString().replace(/\s+/g, '-').toLowerCase()}`;
            const td = document.createElement('td');
            td.className = isWorkDay(date) ? availabilityClass : `${availabilityClass} not-work`;
            row.appendChild(td);
        }

        table.appendChild(row);
    }

    return table;
    function isWorkDay(date) {
        const weekday = weekdayFormat.format(date);
        const dateString = dateISOFormat.format(date).replace(/\//g, '-');
        const isHoliday = holidaySet.has(dateString);
        return !(weekday == 'сб' || weekday == 'вс' || isHoliday);
    }

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
        table.rows[1].cells[colIndex].classList.add('highlight');
    }

    function handleCellMouseLeave() {
        clearHighlights();
    }

    function handleCellClick() {
        if (!firstSelectedCell) {
            resetSelection();
            firstSelectedCell = this;
            this.classList.add('range');
            this.textContent = getDateFromHeader(this);
        } else {
            this.classList.add('range');
            this.textContent = getDateFromHeader(this);
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
        return table.rows[1].cells[colIndex].textContent;
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
            cell.textContent = '';
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