// --- UTILS ---
const $ = id => document.getElementById(id);
const pad = n => n.toString().padStart(2, '0');

// --- FULLSCREEN & TABS ---
const fsBtn = $('fullscreen-btn');
const fsExpand = $('fs-icon-expand');
const fsShrink = $('fs-icon-shrink');

// Listen to native fullscreen changes (handles both button clicks and "Esc" key press)
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        document.body.classList.add('is-fullscreen');
        fsExpand.style.display = 'none';
        fsShrink.style.display = 'block';
    } else {
        document.body.classList.remove('is-fullscreen');
        fsExpand.style.display = 'block';
        fsShrink.style.display = 'none';
    }
});

fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        $(e.target.dataset.target).classList.add('active');
    });
});

// --- AUDIO SYNTH (Web Audio API) ---
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(type) {
    initAudio();
    const t = audioCtx.currentTime;

    if (type === 'beep') {
        const osc = audioCtx.createOscillator();
        osc.type = 'square'; osc.frequency.setValueAtTime(880, t);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t); osc.stop(t + 0.5);
    }
    else if (type === 'digital') {
        for (let i = 0; i < 2; i++) {
            const osc = audioCtx.createOscillator();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(1200, t + i * 0.15);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.05, t + i * 0.15); gain.gain.linearRampToValueAtTime(0, t + i * 0.15 + 0.1);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(t + i * 0.15); osc.stop(t + i * 0.15 + 0.1);
        }
    }
    else if (type === 'chime') {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, t); // C5
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.3, t + 0.1); gain.gain.exponentialRampToValueAtTime(0.001, t + 2);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t); osc.stop(t + 2);
    }
    else if (type === 'bell') {
        [600, 800, 1200].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            osc.type = i === 0 ? 'triangle' : 'sine'; osc.frequency.setValueAtTime(freq, t);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(t); osc.stop(t + 1.5);
        });
    }
    else if (type === 'soft') {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine'; osc.frequency.setValueAtTime(440, t);
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.setValueAtTime(600, t);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.2, t + 0.2); gain.gain.linearRampToValueAtTime(0, t + 0.6);
        osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t); osc.stop(t + 0.6);
    }
    else if (type === 'ringtone') {
        const notes = [659.25, 523.25, 659.25, 783.99]; // E5, C5, E5, G5
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t + i * 0.15);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.1, t + i * 0.15); gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.15);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(t + i * 0.15); osc.stop(t + i * 0.15 + 0.15);
        });
    }
}

// --- CLOCK MODULE ---
function createFlipCard(id) {
    const wrapper = $(id);
    wrapper.innerHTML = `
        <div class="flip-card">
            <div class="card-top">00</div>
            <div class="card-bottom">00</div>
            <div class="flap flap-top">00</div>
            <div class="flap flap-bottom">00</div>
        </div>
    `;
    return {
        val: '00',
        card: wrapper.querySelector('.flip-card'),
        top: wrapper.querySelector('.card-top'),
        bottom: wrapper.querySelector('.card-bottom'),
        flapTop: wrapper.querySelector('.flap-top'),
        flapBottom: wrapper.querySelector('.flap-bottom')
    };
}

const cards = {
    h: createFlipCard('unit-h'),
    m: createFlipCard('unit-m'),
    s: createFlipCard('unit-s')
};

function updateFlip(unit, newVal) {
    const c = cards[unit];
    if (c.val === newVal) return;

    c.card.classList.remove('animating');
    void c.card.offsetWidth; // trigger reflow

    c.top.textContent = newVal;
    c.flapBottom.textContent = newVal;
    c.flapTop.textContent = c.val;
    c.bottom.textContent = c.val;

    c.card.classList.add('animating');
    c.val = newVal;
}

function updateClock() {
    // Force IST calculation
    const now = new Date();
    const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istString);

    let h = istDate.getHours();
    const m = pad(istDate.getMinutes());
    const s = pad(istDate.getSeconds());
    const ampm = h >= 12 ? 'PM' : 'AM';

    h = h % 12;
    h = h ? h : 12; // 0 becomes 12
    h = pad(h);

    updateFlip('h', h); updateFlip('m', m); updateFlip('s', s);

    $('ampm-display').textContent = ampm + ' IST';
    $('date-display').textContent = istDate.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// --- TIMER MODULE ---
const tStartBtn = $('timer-start'), tPauseBtn = $('timer-pause'), tResetBtn = $('timer-reset');
const setupView = $('timer-setup'), runningView = $('timer-running');
const tDisplay = $('timer-display'), statusDot = $('timer-status');
const vignette = $('warning-vignette'), alarmOverlay = $('alarm-overlay');
const circle = document.querySelector('.progress-ring__circle');

const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

let timerInt, totalTime = 0, timeRemaining = 0, isTimerPaused = false;
let alarmInterval;

function setProgress(percent) {
    circle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
}

function finishTimer() {
    clearInterval(timerInt);
    vignette.classList.remove('vignette-active');
    setProgress(0);
    tDisplay.textContent = "00:00:00";
    statusDot.classList.remove('active');

    const tone = $('tone-select').value;
    alarmOverlay.classList.add('active');
    playTone(tone);
    alarmInterval = setInterval(() => playTone(tone), 1500);
}

$('alarm-dismiss').addEventListener('click', () => {
    alarmOverlay.classList.remove('active');
    clearInterval(alarmInterval);
    resetTimer();
});

function updateTimerUI() {
    if (timeRemaining <= 0) { finishTimer(); return; }

    const h = pad(Math.floor(timeRemaining / 3600));
    const m = pad(Math.floor((timeRemaining % 3600) / 60));
    const s = pad(timeRemaining % 60);
    tDisplay.textContent = h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;

    setProgress((timeRemaining / totalTime) * 100);

    if (timeRemaining <= 3 && !isTimerPaused) {
        vignette.classList.add('vignette-active');
    } else {
        vignette.classList.remove('vignette-active');
    }
}

tStartBtn.addEventListener('click', () => {
    const h = parseInt($('t-hours').value || 0);
    const m = parseInt($('t-mins').value || 0);
    const s = parseInt($('t-secs').value || 0);
    totalTime = h * 3600 + m * 60 + s;

    if (totalTime <= 0) return;

    timeRemaining = totalTime;
    initAudio(); // Required context init on user gesture

    setupView.style.display = 'none';
    runningView.style.display = 'flex';
    isTimerPaused = false;
    statusDot.classList.add('active');
    updateTimerUI();

    timerInt = setInterval(() => {
        if (!isTimerPaused) {
            timeRemaining--;
            updateTimerUI();
        }
    }, 1000);
});

tPauseBtn.addEventListener('click', () => {
    isTimerPaused = !isTimerPaused;
    tPauseBtn.textContent = isTimerPaused ? 'Resume' : 'Pause';
    statusDot.classList.toggle('active', !isTimerPaused);
    if (isTimerPaused) vignette.classList.remove('vignette-active');
});

function resetTimer() {
    clearInterval(timerInt);
    vignette.classList.remove('vignette-active');
    setupView.style.display = 'flex';
    runningView.style.display = 'none';
    $('t-hours').value = ''; $('t-mins').value = ''; $('t-secs').value = '';
    isTimerPaused = false;
    tPauseBtn.textContent = 'Pause';
}
tResetBtn.addEventListener('click', resetTimer);


// --- STOPWATCH MODULE ---
let swStart = 0, swElapsed = 0, swInt = null, lapCount = 0;
let isSwRunning = false;

const swDisplay = $('sw-time'), swCents = $('sw-cents');
const swStartBtn = $('sw-start'), swLapBtn = $('sw-lap'), swResetBtn = $('sw-reset');
const lapList = $('lap-list');

function formatSw(ms) {
    const mins = pad(Math.floor(ms / 60000));
    const secs = pad(Math.floor((ms % 60000) / 1000));
    const cs = pad(Math.floor((ms % 1000) / 10));
    return { main: `${mins}:${secs}`, cents: `.${cs}` };
}

function updateSwUI() {
    const f = formatSw(swElapsed);
    swDisplay.textContent = f.main;
    swCents.textContent = f.cents;
}

swStartBtn.addEventListener('click', () => {
    if (!isSwRunning) {
        isSwRunning = true;
        swStartBtn.textContent = 'Pause';
        swStartBtn.classList.replace('btn-primary', 'btn-secondary');
        swLapBtn.disabled = false;
        swStart = Date.now() - swElapsed;
        swInt = setInterval(() => {
            swElapsed = Date.now() - swStart;
            updateSwUI();
        }, 10);
    } else {
        isSwRunning = false;
        swStartBtn.textContent = 'Start';
        swStartBtn.classList.replace('btn-secondary', 'btn-primary');
        swLapBtn.disabled = true;
        clearInterval(swInt);
    }
});

swLapBtn.addEventListener('click', () => {
    if (!isSwRunning) return;
    lapCount++;
    const f = formatSw(swElapsed);
    const div = document.createElement('div');
    div.className = 'lap-item';
    div.innerHTML = `<span>Lap ${pad(lapCount)}</span><span class="lap-total">${f.main}${f.cents}</span>`;
    lapList.prepend(div);
});

swResetBtn.addEventListener('click', () => {
    isSwRunning = false;
    clearInterval(swInt);
    swElapsed = 0; lapCount = 0;
    swStartBtn.textContent = 'Start';
    swStartBtn.classList.replace('btn-secondary', 'btn-primary');
    swLapBtn.disabled = true;
    lapList.innerHTML = '';
    updateSwUI();
});