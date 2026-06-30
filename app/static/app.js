// =========================
// StackMinds AI - FULL APP
// =========================

// -------------------------
// DOM ELEMENTS
// -------------------------
const input = document.getElementById("ideaInput");
const status = document.getElementById("statusText");
const nextStep = document.getElementById("nextStep");
const focusPlan = document.getElementById("focusPlan");
const taskList = document.getElementById("taskList");
const historyList = document.getElementById("historyList");
const winList = document.getElementById("winList");
const missionText = document.getElementById("missionText");
const timerDisplay = document.getElementById("timerDisplay");

// -------------------------
// INIT
// -------------------------
loadWins();
loadHistory();
loadStreak();
checkAchievements();

// -------------------------
// MAIN AI CALL
// -------------------------
async function runStackMinds() {

    const text = input.value.trim();

    if (!text) {
        alert("Type something first.");
        return;
    }

    status.innerText = "Thinking...";

    try {

        const response = await fetch("/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idea: text })
        });

        const data = await response.json();

        nextStep.innerText = data.next_step;
        focusPlan.innerText = data.focus_plan;

        taskList.innerHTML = "";
        data.organized_tasks.forEach(task => {
            const li = document.createElement("li");
            li.innerText = task;
            taskList.appendChild(li);
        });

        missionText.innerText = data.next_step;

        saveHistory(text);
        updateStreak();

        status.innerText = "Done.";

    } catch (err) {

        console.error(err);

        status.innerText = "Offline Mode";

        nextStep.innerText =
            "Do one tiny task for 2 minutes.";

        focusPlan.innerText =
            "No AI available. Stay focused.";

        taskList.innerHTML = `
            <li>Drink water</li>
            <li>Clear one small space</li>
            <li>Do one small task</li>
        `;
    }
}

// -------------------------
// QUICK BUTTONS
// -------------------------
function quickFill(text) {
    input.value = text;
}

// -------------------------
// WIN SYSTEM
// -------------------------
function saveWin() {

    const box = document.getElementById("winInput");

    if (!box.value) return;

    let wins = JSON.parse(localStorage.getItem("wins")) || [];

    wins.unshift(box.value);

    localStorage.setItem("wins", JSON.stringify(wins));

    box.value = "";

    loadWins();
    checkAchievements();
}

function loadWins() {

    let wins = JSON.parse(localStorage.getItem("wins")) || [];

    winList.innerHTML = "";

    wins.forEach(win => {
        const li = document.createElement("li");
        li.innerText = "🏆 " + win;
        winList.appendChild(li);
    });
}

// -------------------------
// HISTORY SYSTEM
// -------------------------
function saveHistory(text) {

    let history = JSON.parse(localStorage.getItem("history")) || [];

    history.unshift(text);
    history = history.slice(0, 20);

    localStorage.setItem("history", JSON.stringify(history));

    loadHistory();
}

function loadHistory() {

    let history = JSON.parse(localStorage.getItem("history")) || [];

    historyList.innerHTML = "";

    history.forEach(item => {
        const li = document.createElement("li");
        li.innerText = item;
        historyList.appendChild(li);
    });
}

// -------------------------
// FOCUS TIMER
// -------------------------
let timer;
let seconds = 300;

function startFocusSprint() {

    clearInterval(timer);
    seconds = 300;
    updateTimer();

    timer = setInterval(() => {

        seconds--;
        updateTimer();

        if (seconds <= 0) {
            clearInterval(timer);
            alert("🎉 Focus Sprint Complete!");
        }

    }, 1000);
}

function updateTimer() {

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    timerDisplay.innerText =
        `${m}:${s.toString().padStart(2, "0")}`;
}

// -------------------------
// VOICE INPUT
// -------------------------
function startVoiceDump() {

    if (!("webkitSpeechRecognition" in window)) {
        alert("Speech recognition not supported.");
        return;
    }

    const recognition = new webkitSpeechRecognition();

    recognition.lang = "en-US";

    recognition.onresult = (event) => {
        input.value = event.results[0][0].transcript;
    };

    recognition.start();
}

// -------------------------
// STREAK SYSTEM
// -------------------------
function loadStreak() {

    const today = new Date().toDateString();
    const last = localStorage.getItem("lastVisit");

    let streak = parseInt(localStorage.getItem("streak") || "0");

    if (last !== today) {

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (last === yesterday.toDateString()) {
            streak++;
        } else {
            streak = 1;
        }

        localStorage.setItem("streak", streak);
        localStorage.setItem("lastVisit", today);
    }

    updateStreakDisplay(streak);
}

function updateStreak() {
    loadStreak();
}

function updateStreakDisplay(streak) {
    if (missionText) {
        missionText.innerText = `🔥 ${streak} Day Streak`;
    }
}

// -------------------------
// ACHIEVEMENTS
// -------------------------
function checkAchievements() {

    let wins = JSON.parse(localStorage.getItem("wins")) || [];

    if (wins.length >= 5 &&
        !localStorage.getItem("achievementMomentum")) {

        localStorage.setItem("achievementMomentum", "true");

        alert("🏆 Achievement Unlocked: Momentum!");
    }
          }
