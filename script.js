import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, deleteField, collection, addDoc, serverTimestamp, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const appId = typeof __app_id !== 'undefined' ? __app_id : 'al-waqiah-vibrant';
let app, db, auth;
let authReady = false;

const state = {
    lena: {},
    raihan: {},
    notes: []
};

const START_DATE = new Date(2026, 9, 21); // 21 Oktober 2026
const TOTAL_DAYS = 30;

try {
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (error) {
    console.error("Firebase init failed:", error);
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function isDayMissed(dayIndex) {
    const today = new Date();
    today.setHours(0,0,0,0); 
    
    const expectedDate = new Date(START_DATE);
    expectedDate.setDate(expectedDate.getDate() + (dayIndex - 1));
    expectedDate.setHours(0,0,0,0);

    return today > expectedDate; 
}

function shootConfetti(isLena) {
    const colors = isLena ? ['#e879f9', '#fdf4ff', '#facc15'] : ['#22d3ee', '#ecfeff', '#facc15'];
    
    confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: colors,
        shapes: ['star', 'circle'],
        disableForReducedMotion: true
    });
}

function renderBoards() {
    ['lena', 'raihan'].forEach(user => {
        const container = document.getElementById(`grid-${user}`);
        const userData = state[user] || {};
        const isLena = user === 'lena';
        
        let completedCount = 0;
        let missedCount = 0;
        
        container.innerHTML = '';

        for (let i = 1; i <= TOTAL_DAYS; i++) {
            const dayData = userData[i];
            const isCompleted = !!dayData;
            const isMissed = !isCompleted && isDayMissed(i);
            
            if (isCompleted) completedCount++;
            if (isMissed) missedCount++;

            const box = document.createElement('div');
            
            let baseClasses = "day-card relative flex flex-col items-center justify-center rounded-2xl p-2 cursor-pointer h-16 md:h-20 shadow-md select-none border-2 backdrop-blur-sm ";
            
            if (isCompleted) {
                baseClasses += isLena 
                    ? "bg-gradient-to-br from-pink-100 to-fuchsia-100 border-fuchsia-300 text-fuchsia-800" 
                    : "bg-gradient-to-br from-cyan-100 to-blue-100 border-cyan-300 text-cyan-800";
            } else if (isMissed) {
                baseClasses += "bg-white/40 border-gray-200 text-gray-500";
            } else {
                baseClasses += "bg-white/70 border-white/80 text-gray-700 hover:bg-white/90";
            }

            box.className = baseClasses;
            box.onclick = () => toggleDay(user, i, isCompleted);

            if (isCompleted) {
                // Ganti Ikon Hati menjadi Bintang Bersinar
                box.innerHTML = `
                    <i class="fa-solid fa-star text-2xl md:text-3xl mb-1 glowing-star"></i>
                    <span class="text-[10px] md:text-xs font-black bg-white/80 px-2 py-0.5 rounded-full absolute bottom-1 shadow-sm">${formatTime(dayData.timestamp)}</span>
                    <span class="absolute top-1 right-1.5 text-[9px] font-bold opacity-60">${i}</span>
                `;
            } else {
                box.innerHTML = `
                    <span class="text-sm md:text-base font-bold">H-${i}</span>
                    ${isMissed ? '<i class="fa-solid fa-xmark text-xs mt-1 text-red-500 drop-shadow-sm"></i>' : '<div class="w-2 h-2 rounded-full bg-gray-400/50 mt-2"></div>'}
                `;
            }
            
            container.appendChild(box);
        }

        document.getElementById(`stat-comp-${user}`).innerText = completedCount;
        document.getElementById(`stat-miss-${user}`).innerText = missedCount;
        document.getElementById(`stat-rem-${user}`).innerText = TOTAL_DAYS - completedCount;
        
        const percentage = Math.min((completedCount / TOTAL_DAYS) * 50, 50); 
        document.getElementById(`percent-${user}`).innerText = `${Math.round((completedCount/TOTAL_DAYS)*100)}%`;
        
        const offset = `calc(${percentage}% + 1rem)`;
        document.getElementById(`progress-${user}`).style[isLena ? 'left' : 'right'] = percentage === 50 ? '50%' : percentage + '%';
        
        if (percentage === 50) {
             document.getElementById(`progress-${user}`).style.transform = `translateY(-50%) ${isLena ? 'translateX(-110%)' : 'translateX(110%)'}`;
        } else {
             document.getElementById(`progress-${user}`).style.transform = `translateY(-50%) ${isLena ? 'translateX(-50%)' : 'translateX(50%)'}`;
        }
    });
}

function renderNotes() {
    const container = document.getElementById('notes-list');
    if (state.notes.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 font-semibold text-sm mt-12 bg-white/50 p-4 rounded-xl inline-block mx-auto">Belum ada pesan.</div>';
        container.classList.add('flex', 'justify-center');
        return;
    } else {
        container.classList.remove('flex', 'justify-center');
    }

    container.innerHTML = '';
    const sortedNotes = [...state.notes].sort((a, b) => {
        const timeA = a.serverTime ? new Date(a.serverTime).getTime() : 0;
        const timeB = b.serverTime ? new Date(b.serverTime).getTime() : 0;
        return timeB - timeA; 
    });

    sortedNotes.forEach(note => {
        const isLena = note.sender === 'Lena';
        const el = document.createElement('div');
        
        const alignment = isLena ? 'mr-8' : 'ml-8';
        const bgColors = isLena ? 'bg-gradient-to-r from-fuchsia-100 to-pink-50 border-fuchsia-200' : 'bg-gradient-to-r from-cyan-50 to-blue-100 border-cyan-200';
        const textColors = isLena ? 'text-fuchsia-800' : 'text-cyan-800';

        el.className = `p-4 rounded-2xl shadow-sm border-2 ${bgColors} ${alignment} relative transform transition-transform hover:scale-[1.02]`;
        
        el.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-extrabold ${textColors} flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-xs">${note.sender.charAt(0)}</div>
                    ${note.sender}
                </span>
                <span class="text-xs font-bold text-gray-500 bg-white/60 px-2 py-1 rounded-lg">${note.timeString}</span>
            </div>
            <p class="text-gray-800 font-medium leading-relaxed">${note.text}</p>
        `;
        container.appendChild(el);
    });
}

async function toggleDay(user, dayIndex, isCurrentlyCompleted) {
    if (!authReady || !db) {
        if (isCurrentlyCompleted) {
            delete state[user][dayIndex];
        } else {
            state[user][dayIndex] = { timestamp: new Date().toISOString() };
            shootConfetti(user === 'lena');
        }
        renderBoards();
        return;
    }

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'mission_progress', user);
    try {
        if (isCurrentlyCompleted) {
            await updateDoc(docRef, { [`days.${dayIndex}`]: deleteField() });
        } else {
            await setDoc(docRef, {
                days: { [dayIndex]: { timestamp: new Date().toISOString() } }
            }, { merge: true });
            shootConfetti(user === 'lena');
        }
    } catch (error) {
        console.error("Error updating day:", error);
    }
}

async function postNote() {
    const sender = document.getElementById('note-sender').value;
    const text = document.getElementById('note-text').value.trim();
    
    if (!text) return;
    
    document.getElementById('note-text').value = ''; 

    if (!authReady || !db) {
        state.notes.push({
            sender, text, 
            timeString: formatTime(new Date().toISOString()),
            serverTime: new Date().toISOString()
        });
        renderNotes();
        return;
    }

    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'notes_vibrant');
    try {
        await addDoc(colRef, {
            sender,
            text,
            isoTime: new Date().toISOString(),
            serverTimestamp: serverTimestamp() 
        });
    } catch (error) {
        console.error("Error adding note:", error);
    }
}

async function init() {
    renderBoards();
    renderNotes();

    if (!auth) return;

    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        authReady = true;

        ['lena', 'raihan'].forEach(user => {
            const ref = doc(db, 'artifacts', appId, 'public', 'data', 'mission_progress', user);
            onSnapshot(ref, (snap) => {
                state[user] = snap.exists() ? (snap.data().days || {}) : {};
                renderBoards();
            }, err => console.error(err));
        });

        const notesRef = collection(db, 'artifacts', appId, 'public', 'data', 'notes_vibrant');
        onSnapshot(query(notesRef), (snapshot) => {
            state.notes = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                state.notes.push({
                    id: doc.id,
                    sender: data.sender,
                    text: data.text,
                    timeString: formatTime(data.isoTime),
                    serverTime: data.serverTimestamp ? data.serverTimestamp.toDate().toISOString() : data.isoTime
                });
            });
            renderNotes();
        }, err => console.error(err));

    } catch (error) {
        console.error("Auth failed:", error);
    }
}

// Mengekspos fungsi ke window agar dapat dipanggil dari HTML
window.toggleDay = toggleDay;
window.postNote = postNote;

init();