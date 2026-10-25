document.addEventListener('DOMContentLoaded', () => {
    // Setting awal: Tanggal mulai 21 Oktober 2026
    const startDate = new Date('2026-10-21T00:00:00');
    const totalDays = 30;

    const grids = {
        lena: document.getElementById('grid-lena'),
        raihan: document.getElementById('grid-raihan')
    };

    const statsElements = {
        lena: {
            completed: document.getElementById('completed-lena'),
            missed: document.getElementById('missed-lena'),
            remaining: document.getElementById('remaining-lena')
        },
        raihan: {
            completed: document.getElementById('completed-raihan'),
            missed: document.getElementById('missed-raihan'),
            remaining: document.getElementById('remaining-raihan')
        }
    };

    // Load data dari LocalStorage agar tersimpan otomatis
    let appData = JSON.parse(localStorage.getItem('alWaqiahData')) || {
        lena: {},
        raihan: {}
    };

    function formatDate(date) {
        const d = date.getDate();
        const m = date.toLocaleString('id-ID', { month: 'short' });
        return `${d} ${m}`;
    }

    function formatTime(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    function updateStats(person) {
        let completed = Object.keys(appData[person]).length;
        let remaining = totalDays - completed;
        
        statsElements[person].completed.textContent = completed;
        statsElements[person].remaining.textContent = remaining;
    }

    function toggleDay(person, dayIndex) {
        if (appData[person][dayIndex]) {
            // Batalkan / Hapus tanda selesai
            delete appData[person][dayIndex];
        } else {
            // Tandai selesai, simpan waktu saat ini
            appData[person][dayIndex] = formatTime(new Date());
        }
        
        // Simpan ke local storage
        localStorage.setItem('alWaqiahData', JSON.stringify(appData));
        
        // Render ulang grid
        renderGrid(person);
    }

    function renderGrid(person) {
        grids[person].innerHTML = '';

        for (let i = 0; i < totalDays; i++) {
            let currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const box = document.createElement('div');
            box.className = 'day-box';
            
            // Periksa apakah hari ini sudah diselesaikan
            const isCompleted = appData[person][i];
            if (isCompleted) {
                box.classList.add('completed');
            }

            // Text Tanggal
            const dateSpan = document.createElement('span');
            dateSpan.className = 'date-text';
            dateSpan.textContent = formatDate(currentDate);

            // Icon Bintang
            const iconElement = document.createElement('i');
            iconElement.className = 'fas fa-star star-icon';

            // Text Waktu otomatis jika sudah selesai
            const timeSpan = document.createElement('span');
            timeSpan.className = 'time-text';
            if (isCompleted) {
                timeSpan.textContent = isCompleted; 
            }

            box.appendChild(dateSpan);
            box.appendChild(iconElement);
            box.appendChild(timeSpan);

            // Event Klik
            box.addEventListener('click', () => {
                toggleDay(person, i);
            });

            grids[person].appendChild(box);
        }

        updateStats(person);
    }

    // Inisialisasi awal
    renderGrid('lena');
    renderGrid('raihan');
});
