let dhikrList = JSON.parse(localStorage.getItem('dhikr')) || [];
let currentDhikr = null;
let currentIndex = 0;
let isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let audioContext = null;

document.addEventListener('copy', (e) => {
    e.preventDefault();
    alert('النسخ غير مسموح به في هذه الصفحة');
});

function navigateDhikr(direction) {
    if (dhikrList.length === 0) return; // Don't navigate if list is empty
    currentIndex += direction;
    if (currentIndex < 0) {
        currentIndex = dhikrList.length - 1;
    } else if (currentIndex >= dhikrList.length) {
        currentIndex = 0;
    }
    currentDhikr = dhikrList[currentIndex];
    updateCounterDisplay();
    document.getElementById('currentDhikrName').textContent = currentDhikr.name;
}

function saveToLocalStorage() {
    localStorage.setItem('dhikr', JSON.stringify(dhikrList));
    localStorage.setItem('soundEnabled', isSoundEnabled);
}

function playBeep() {
    if (!isSoundEnabled) return;
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            return;
        }
    }
    // Resume context if it's suspended (required for autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    document.querySelector('.sound-btn').textContent = isSoundEnabled ? '🔊' : '🔇';
    saveToLocalStorage();
    if (isSoundEnabled && !audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
        }
    }
}

function addDhikr() {
    const nameInput = document.getElementById('dhikrName');
    const countInput = document.getElementById('dhikrCount');
    const newDhikr = {
        id: Date.now(),
        name: nameInput.value.trim(),
        target: parseInt(countInput.value) || 33, 
        current: 0
    };

    if (newDhikr.name === '') {
        alert('يرجى إدخال الذكر');
        return;
    }
    if (newDhikr.target <= 0) {
        alert('يرجى إدخال عدد مرات صحيح أكبر من صفر');
        return;
    }

    dhikrList.push(newDhikr);
    renderDhikrList();
    saveToLocalStorage();
    nameInput.value = '';
    countInput.value = 1;
}

function editDhikr(id) {
    const itemIndex = dhikrList.findIndex(d => d.id === id);
    if (itemIndex === -1) return;
    const item = dhikrList[itemIndex];

    const newName = prompt("تعديل الذكر:", item.name);
    if (newName !== null && newName.trim()) {
        item.name = newName.trim();
    }

    const newTargetStr = prompt("تعديل عدد المرات:", item.target);
    const newTarget = parseInt(newTargetStr);
    if (newTargetStr !== null && !isNaN(newTarget) && newTarget > 0) {
        item.target = newTarget;
    }

    saveToLocalStorage();
    renderDhikrList();
    // If the edited item is the current one, update the counter page display
    if (currentDhikr && currentDhikr.id === id) {
        document.getElementById('currentDhikrName').textContent = item.name;
        updateCounterDisplay();
    }
}

function showCounterPage(id) {
    currentIndex = dhikrList.findIndex(item => item.id === id);
    if (currentIndex === -1) return; // Item not found (e.g., deleted)
    currentDhikr = dhikrList[currentIndex];
    document.querySelector('.main-page').style.display = 'none';
    document.querySelector('.counter-page').style.display = 'flex';
    document.getElementById('currentDhikrName').textContent = currentDhikr.name;
    updateCounterDisplay();
    document.querySelector('.sound-btn').textContent = isSoundEnabled ? '🔊' : '🔇';
}

function handleCounterClick() {
    incrementCounter();
    const counterDisplay = document.querySelector('.counter-display');
    counterDisplay.classList.add('flash');
    counterDisplay.addEventListener('animationend', () => {
        counterDisplay.classList.remove('flash');
    }, { once: true });
}

function incrementCounter() {
    if (currentDhikr) {
        currentDhikr.current++;
        if (currentDhikr.current > currentDhikr.target) {
            currentDhikr.current = 0;
        }
        playBeep();
        updateCounterDisplay();
        saveToLocalStorage();
    }
}

function resetCounter() {
    if (currentDhikr) {
        currentDhikr.current = 0;
        updateCounterDisplay();
        saveToLocalStorage();
    }
}

function updateCounterDisplay() {
    if (currentDhikr) {
        document.getElementById('currentCount').textContent = currentDhikr.current;
        document.getElementById('targetCount').textContent = currentDhikr.target;
    } else {
        document.getElementById('currentCount').textContent = '0';
        document.getElementById('targetCount').textContent = '0';
        document.getElementById('currentDhikrName').textContent = 'لا يوجد ذكر محدد';
    }
}

function deleteDhikr(id) {
    const itemIndex = dhikrList.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    if (!confirm(`هل أنت متأكد من حذف الذكر: "${dhikrList[itemIndex].name}"؟`)) {
        return;
    }

    dhikrList.splice(itemIndex, 1);
    saveToLocalStorage();
    renderDhikrList();

    if (currentDhikr && currentDhikr.id === id) {
        currentDhikr = null;
        showMainPage();
    }
}

function showMainPage() {
    document.querySelector('.main-page').style.display = 'block';
    document.querySelector('.counter-page').style.display = 'none';
    currentDhikr = null; 
    renderDhikrList();
}

function renderDhikrList() {
    const listContainer = document.getElementById('dhikrList');
    listContainer.innerHTML = ''; 
    if (dhikrList.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #ccc;">لم تقم بإضافة أي أذكار بعد. استخدم النموذج أعلاه للإضافة.</p>';
        return;
    }
    dhikrList.forEach(dhikr => {
        const dhikrElement = document.createElement('div');
        dhikrElement.className = 'dhikr-item';
        dhikrElement.setAttribute('data-id', dhikr.id);

        const nameDiv = document.createElement('div');
        nameDiv.className = 'dhikr-name';
        nameDiv.textContent = `${dhikr.name} (${dhikr.target} مرة)`;
        nameDiv.onclick = () => showCounterPage(dhikr.id);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'action-buttons';

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.textContent = 'تعديل';
        editButton.onclick = (event) => {
            event.stopPropagation(); 
            editDhikr(dhikr.id);
        };

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'حذف';
        deleteButton.onclick = (event) => {
            event.stopPropagation(); 
            deleteDhikr(dhikr.id);
        };

        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);

        dhikrElement.appendChild(nameDiv);
        dhikrElement.appendChild(actionsDiv);

        listContainer.appendChild(dhikrElement);
    });
}

// Initialize the app
window.onload = () => {
    renderDhikrList();
    // Restore sound state on load
    document.querySelector('.sound-btn').textContent = isSoundEnabled ? '🔊' : '🔇';

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js') 
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            }).catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
};

