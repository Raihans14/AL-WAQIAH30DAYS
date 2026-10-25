document.addEventListener('DOMContentLoaded', () => {
    // Tanggal mulai 21 Oktober 2026
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

    let appData = JSON.parse(localStorage.getItem('alWaqiahData')) || {
        lena: {},
        raihan: {}
    };

    function formatDate(date) {
        const d = date.getDate();
        const m = date.toLocaleString('id-ID', { month: 'short' });
        return `${d} ${m}`; // Hasil: 21 Okt
    }

    function formatTime(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    // Fungsi mengecek apakah hari sudah lewat
    function isMissed(dateStr) {
        let today = new Date();
        today.setHours(0,0,0,0);
        let targetDate = new Date(dateStr);
        targetDate.setHours(0,0,0,0);
        return today > targetDate;
    }

    function updateStats(person) {
        let completed = Object.keys(appData[person]).length;
        
        let missedCount = 0;
        for (let i = 0; i < totalDays; i++) {
            let currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            // Jika belum di-klik dan harinya sudah lewat = Missed
            if (!appData[person][i] && isMissed(currentDate)) {
                missedCount++;
            }
        }
        
        let remaining = totalDays - completed - missedCount;
        if(remaining < 0) remaining = 0;
        
        statsElements[person].completed.textContent = completed;
        statsElements[person].missed.textContent = missedCount;
        statsElements[person].remaining.textContent = remaining;
    }

    function toggleDay(person, dayIndex) {
        if (appData[person][dayIndex]) {
            delete appData[person][dayIndex];
        } else {
            appData[person][dayIndex] = formatTime(new Date());
        }
        localStorage.setItem('alWaqiahData', JSON.stringify(appData));
        renderGrid(person);
    }

    function renderGrid(person) {
        grids[person].innerHTML = '';

        for (let i = 0; i < totalDays; i++) {
            let currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayNumber = i + 1;
            const isCompleted = appData[person][i];
            const missed = !isCompleted && isMissed(currentDate);

            const box = document.createElement('div');
            box.className = 'day-box';
            if (isCompleted) box.classList.add('completed');

            // Nomor Kecil Kanan Atas
            const numSpan = document.createElement('span');
            numSpan.className = 'day-number';
            numSpan.textContent = dayNumber;
            box.appendChild(numSpan);

            // Container Tengah
            const centerDiv = document.createElement('div');
            centerDiv.className = 'center-content';

            // Teks H- (H-1, H-2)
            const hText = document.createElement('span');
            hText.className = 'h-text';
            hText.textContent = `H-${dayNumber}`;
            centerDiv.appendChild(hText);
            
            // Teks Tanggal (21 Okt)
            const dateText = document.createElement('span');
            dateText.className = 'actual-date';
            dateText.textContent = formatDate(currentDate);
            centerDiv.appendChild(dateText);

            // Ikon Silang (Missed) atau Titik
            if (missed) {
                const crossIcon = document.createElement('i');
                crossIcon.className = 'fas fa-times missed-icon';
                centerDiv.appendChild(crossIcon);
            } else {
                const dotIcon = document.createElement('i');
                dotIcon.className = 'fas fa-circle dot-icon';
                centerDiv.appendChild(dotIcon);
            }

            // Bintang (Selesai)
            const starIcon = document.createElement('i');
            starIcon.className = 'fas fa-star star-icon';
            centerDiv.appendChild(starIcon);

            box.appendChild(centerDiv);

            // Teks Waktu di Bawah
            const timeSpan = document.createElement('span');
            timeSpan.className = 'time-text';
            if (isCompleted) timeSpan.textContent = isCompleted;
            box.appendChild(timeSpan);

            // Aksi Klik
            box.addEventListener('click', () => {
                toggleDay(person, i);
            });

            grids[person].appendChild(box);
        }

        updateStats(person);
    }

    renderGrid('lena');
    renderGrid('raihan');
});