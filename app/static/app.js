const input = document.getElementById("ideaInput");
const statusText = document.getElementById("statusText");
const nextStep = document.getElementById("nextStep");
const focusPlan = document.getElementById("focusPlan");
const taskList = document.getElementById("taskList");
const historyList = document.getElementById("historyList");
const winList = document.getElementById("winList");
const missionText = document.getElementById("missionText");
const timerDisplay = document.getElementById("timerDisplay");
const progressText = document.getElementById("progressText");
const moodStatus = document.getElementById("moodStatus");
const weeklyInsights = document.getElementById("weeklyInsights");

let timer;
let seconds = 300;

loadWins();
loadHistory();
loadStreak();
loadMood();
updateProgress();
updateWeeklyInsights();

function quickFill(text) {
  input.value = text;
}

async function runStackMinds() {
  const text = input.value.trim();

  if (!text) {
    statusText.innerText = "Type a brain dump first.";
    return;
  }

  statusText.innerText = "Turning chaos into clarity...";

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idea: text
      })
    });

    const data = await response.json();

    nextStep.innerText =
      data.next_step || "Pick one tiny action and start for 2 minutes.";

    focusPlan.innerText =
      data.focus_plan || "Start small. Do not solve everything at once.";

    missionText.innerText =
      data.next_step || "One small win today.";

    taskList.innerHTML = "";

    const tasks = data.organized_tasks || [];

    if (tasks.length === 0) {
      const li = document.createElement("li");
      li.innerText = "No tasks found. Try a bigger brain dump.";
      taskList.appendChild(li);
    } else {
      tasks.forEach(task => {
        const li = document.createElement("li");
        li.innerText = task;
        taskList.appendChild(li);
      });
    }

    saveHistory(text, data.next_step || "");
    incrementBrainDumpCount();
    updateProgress();
    updateWeeklyInsights();

    statusText.innerText = "Done.";
  } catch (error) {
    statusText.innerText = "Offline ADHD Coach";

    nextStep.innerText = "Do one tiny task for 2 minutes.";

    focusPlan.innerText =
      "AI is unavailable. Use the fallback plan: breathe, pick one visible task, start small.";

    missionText.innerText = "Do one tiny task for 2 minutes.";

    taskList.innerHTML = `
      <li>Drink water</li>
      <li>Clear one small space</li>
      <li>Do one task for 2 minutes</li>
    `;
  }
}

function saveWin() {
  const box = document.getElementById("winInput");
  const win = box.value.trim();

  if (!win) return;

  const wins = JSON.parse(localStorage.getItem("wins") || "[]");

  wins.unshift({
    text: win,
    date: new Date().toISOString()
  });

  localStorage.setItem("wins", JSON.stringify(wins.slice(0, 50)));

  box.value = "";

  loadWins();
  checkAchievements();
  updateProgress();
  updateWeeklyInsights();
}

function loadWins() {
  const wins = JSON.parse(localStorage.getItem("wins") || "[]");

  winList.innerHTML = "";

  wins.slice(0, 8).forEach(win => {
    const li = document.createElement("li");
    li.innerText = "🏆 " + (win.text || win);
    winList.appendChild(li);
  });
}

function saveHistory(text, next) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.unshift({
    text: text,
    nextStep: next,
    date: new Date().toISOString()
  });

  localStorage.setItem("history", JSON.stringify(history.slice(0, 20)));

  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  historyList.innerHTML = "";

  history.slice(0, 8).forEach(item => {
    const li = document.createElement("li");

    if (typeof item === "string") {
      li.innerText = item;
    } else {
      li.innerText = item.nextStep
        ? item.nextStep
        : item.text;
    }

    historyList.appendChild(li);
  });
}

function startFocusSprint() {
  clearInterval(timer);

  seconds = 300;
  updateTimer();

  statusText.innerText = "Focus Sprint started. Starting is the win.";

  timer = setInterval(() => {
    seconds--;
    updateTimer();

    if (seconds <= 0) {
      clearInterval(timer);
      statusText.innerText = "Focus Sprint complete.";
      saveAutoWin("Completed a 5-minute focus sprint");
      alert("🎉 Focus Sprint Complete!");
    }
  }, 1000);
}

function updateTimer() {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  timerDisplay.innerText =
    `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function startVoiceDump() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    statusText.innerText = "Voice input is not supported on this browser.";
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;

  statusText.innerText = "Listening...";

  recognition.start();

  recognition.onresult = event => {
    input.value = event.results[0][0].transcript;
    statusText.innerText = "Voice dump added.";
  };

  recognition.onerror = () => {
    statusText.innerText = "Voice input failed. Try typing instead.";
  };
}

function loadStreak() {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem("lastVisit");

  let streak = parseInt(localStorage.getItem("streak") || "0");

  if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastVisit === yesterday.toDateString()) {
      streak++;
    } else {
      streak = 1;
    }

    localStorage.setItem("streak", streak.toString());
    localStorage.setItem("lastVisit", today);
  }

  if (!missionText.innerText || missionText.innerText === "One small win today.") {
    missionText.innerText = `🔥 ${streak} day streak`;
  }
}

function saveMood(mood) {
  const moodData = {
    mood: mood,
    date: new Date().toISOString()
  };

  localStorage.setItem("todayMood", JSON.stringify(moodData));

  loadMood();
  updateWeeklyInsights();

  statusText.innerText = "Mood saved.";
}

function loadMood() {
  const saved = localStorage.getItem("todayMood");

  if (!saved) {
    moodStatus.innerText = "No mood saved yet.";
    return;
  }

  const data = JSON.parse(saved);

  moodStatus.innerText = "Today’s mood: " + data.mood;
}

function saveAutoWin(text) {
  const wins = JSON.parse(localStorage.getItem("wins") || "[]");

  wins.unshift({
    text: text,
    date: new Date().toISOString()
  });

  localStorage.setItem("wins", JSON.stringify(wins.slice(0, 50)));

  loadWins();
  updateProgress();
  updateWeeklyInsights();
}

function incrementBrainDumpCount() {
  const count = parseInt(localStorage.getItem("brainDumpCount") || "0") + 1;
  localStorage.setItem("brainDumpCount", count.toString());
}

function updateProgress() {
  const wins = JSON.parse(localStorage.getItem("wins") || "[]").length;
  const brainDumps = parseInt(localStorage.getItem("brainDumpCount") || "0");
  const moodSaved = localStorage.getItem("todayMood") ? 1 : 0;

  let score = 0;

  if (brainDumps > 0) score += 35;
  if (wins > 0) score += 35;
  if (moodSaved) score += 30;

  score = Math.min(score, 100);

  if (progressText) {
    progressText.innerText = score + "%";
  }
}

function updateWeeklyInsights() {
  const wins = JSON.parse(localStorage.getItem("wins") || "[]").length;
  const history = JSON.parse(localStorage.getItem("history") || "[]").length;
  const streak = localStorage.getItem("streak") || "0";
  const mood = localStorage.getItem("todayMood");

  let moodText = "No mood saved";

  if (mood) {
    moodText = JSON.parse(mood).mood;
  }

  weeklyInsights.innerText =
    `🔥 Streak: ${streak} days · 🧠 Brain dumps: ${history} · 🏆 Wins: ${wins} · 😊 Mood: ${moodText}`;
}

function checkAchievements() {
  const wins = JSON.parse(localStorage.getItem("wins") || "[]");

  if (wins.length >= 5 && !localStorage.getItem("achievementMomentum")) {
    localStorage.setItem("achievementMomentum", "true");
    alert("🏆 Achievement Unlocked: Momentum!");
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/static/service-worker.js");
}
