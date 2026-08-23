const input = document.getElementById("ideaInput");
const statusText = document.getElementById("statusText");
const nextStep = document.getElementById("nextStep");
const focusPlan = document.getElementById("focusPlan");
const taskList = document.getElementById("taskList");
const thenDoList = document.getElementById("thenDoList");
const canWaitList = document.getElementById("canWaitList");
const historyList = document.getElementById("historyList");
const winList = document.getElementById("winList");
const missionText = document.getElementById("missionText");
const timerDisplay = document.getElementById("timerDisplay");
const focusSprintButton = document.getElementById("focusSprintButton");
const progressText = document.getElementById("progressText");
const moodStatus = document.getElementById("moodStatus");
const weeklyInsights = document.getElementById("weeklyInsights");

let timer;
let focusMinutes = 5;
let seconds = focusMinutes * 60;


// =========================
// LOAD SAVED DATA
// =========================

loadWins();
loadHistory();
loadStreak();
loadMood();
updateProgress();
updateWeeklyInsights();
updateTimer();


// =========================
// QUICK FILL
// =========================

function quickFill(text) {
  input.value = text;
  input.focus();
}


// =========================
// RUN STACKMINDS AI
// =========================

async function runStackMinds() {
  const text = input.value.trim();

  if (!text) {
    statusText.innerText = "Type or say what is overwhelming you first.";
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();


    // =========================
    // DO THIS NOW
    // =========================

    nextStep.innerText =
      data.next_step ||
      "Pick one tiny useful action and start now.";

    missionText.innerText =
      data.next_step ||
      "One small win today.";


    // =========================
    // FOCUS PLAN
    // =========================

    focusPlan.innerText =
      data.focus_plan ||
      "Work on only this one action until the timer ends.";


    // =========================
    // THEN DO THIS
    // =========================

    renderList(
      thenDoList,
      data.then_do_this || [],
      "Nothing else needs your attention yet."
    );


    // =========================
    // CAN WAIT
    // =========================

    renderList(
      canWaitList,
      data.can_wait || [],
      "Nothing has been pushed aside."
    );


    // =========================
    // ALL ORGANIZED TASKS
    // =========================

    renderList(
      taskList,
      data.organized_tasks || [],
      "No separate tasks found."
    );


    // =========================
    // DYNAMIC FOCUS SPRINT
    // =========================

    const requestedMinutes =
      Number(data.focus_minutes);

    if ([5, 10, 15].includes(requestedMinutes)) {
      focusMinutes = requestedMinutes;
    } else {
      focusMinutes = 5;
    }

    seconds = focusMinutes * 60;

    updateTimer();

    if (focusSprintButton) {
      focusSprintButton.innerText =
        `⏱ Start ${focusMinutes}-Min Focus Sprint`;
    }


    // =========================
    // SAVE / UPDATE
    // =========================

    saveHistory(
      text,
      data.next_step || ""
    );

    incrementBrainDumpCount();

    updateProgress();
    updateWeeklyInsights();

    statusText.innerText =
      "Clarity ready. Start with Do This Now.";

  } catch (error) {
    console.error(
      "STACKMINDS ERROR:",
      error
    );

    runOfflineFallback(text);
  }
}


// =========================
// RENDER LIST
// =========================

function renderList(element, items, emptyMessage) {
  if (!element) return;

  element.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    const li = document.createElement("li");
    li.innerText = emptyMessage;
    element.appendChild(li);
    return;
  }

  items.forEach(item => {
    const li = document.createElement("li");
    li.innerText = item;
    element.appendChild(li);
  });
}


// =========================
// OFFLINE FALLBACK
// =========================

function runOfflineFallback(text) {
  statusText.innerText =
    "Offline ADHD Coach";

  nextStep.innerText =
    "Pick one useful task and work on it for 5 minutes.";

  missionText.innerText =
    "One small action. Nothing else yet.";

  focusPlan.innerText =
    "Ignore the rest for five minutes. Starting is the win.";

  renderList(
    thenDoList,
    [
      "Finish the first small action",
      "Take a short pause",
      "Choose one more useful task"
    ],
    "Nothing else yet."
  );

  renderList(
    canWaitList,
    [],
    "Everything else can wait until the first action is done."
  );

  const fallbackTasks =
    text
      .replace(/\./g, ",")
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

  renderList(
    taskList,
    fallbackTasks,
    "Write a few things that are on your mind."
  );

  focusMinutes = 5;
  seconds = 300;

  updateTimer();

  if (focusSprintButton) {
    focusSprintButton.innerText =
      "⏱ Start 5-Min Focus Sprint";
  }
}


// =========================
// TALK IT OUT
// =========================

async function startVoiceDump() {
  statusText.innerText =
    "Starting microphone...";

  try {

    // -------------------------
    // NATIVE ANDROID VERSION
    // -------------------------

    const NativeSpeechRecognition =
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.SpeechRecognition;

    if (NativeSpeechRecognition) {

      const available =
        await NativeSpeechRecognition.available();

      if (!available.available) {
        statusText.innerText =
          "Speech recognition is not available on this device.";
        return;
      }

      const permission =
        await NativeSpeechRecognition.checkPermissions();

      if (
        permission.speechRecognition !== "granted"
      ) {

        statusText.innerText =
          "Microphone permission needed...";

        const requested =
          await NativeSpeechRecognition.requestPermissions();

        if (
          requested.speechRecognition !== "granted"
        ) {
          statusText.innerText =
            "Please allow microphone permission to use Talk It Out.";
          return;
        }
      }

      statusText.innerText =
        "Listening...";

      const result =
        await NativeSpeechRecognition.start({
          language: "en-US",
          maxResults: 1,
          prompt: "Talk it out to StackMinds",
          partialResults: false,
          popup: true
        });

      if (
        result &&
        result.matches &&
        result.matches.length > 0
      ) {

        input.value =
          result.matches[0];

        statusText.innerText =
          "Voice dump added. Tap Run StackMinds AI.";

      } else {

        statusText.innerText =
          "I didn't catch that. Tap Talk It Out and try again.";
      }

      return;
    }


    // -------------------------
    // BROWSER FALLBACK
    // -------------------------

    const BrowserSpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!BrowserSpeechRecognition) {
      statusText.innerText =
        "Voice input is not supported on this device.";
      return;
    }

    const recognition =
      new BrowserSpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    statusText.innerText =
      "Listening...";

    recognition.start();

    recognition.onresult = event => {
      if (
        event.results &&
        event.results[0] &&
        event.results[0][0]
      ) {

        input.value =
          event.results[0][0].transcript;

        statusText.innerText =
          "Voice dump added. Tap Run StackMinds AI.";
      }
    };

    recognition.onerror = event => {
      console.error(
        "BROWSER VOICE ERROR:",
        event
      );

      statusText.innerText =
        "Voice input failed. Tap Talk It Out and try again.";
    };

    recognition.onend = () => {
      if (
        statusText.innerText ===
        "Listening..."
      ) {
        statusText.innerText =
          "Listening stopped.";
      }
    };

  } catch (error) {
    console.error(
      "VOICE ERROR:",
      error
    );

    statusText.innerText =
      "Voice input failed. Tap Talk It Out and try again.";
  }
}


// =========================
// FOCUS SPRINT
// =========================

function startFocusSprint() {
  clearInterval(timer);

  seconds =
    focusMinutes * 60;

  updateTimer();

  statusText.innerText =
    `${focusMinutes}-minute Focus Sprint started. One task only.`;

  timer = setInterval(() => {
    seconds--;

    updateTimer();

    if (seconds <= 0) {
      clearInterval(timer);

      seconds = 0;

      updateTimer();

      statusText.innerText =
        "Focus Sprint complete.";

      saveAutoWin(
        `Completed a ${focusMinutes}-minute focus sprint`
      );

      alert(
        "🎉 Focus Sprint Complete!"
      );
    }

  }, 1000);
}


function updateTimer() {
  if (!timerDisplay) return;

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    seconds % 60;

  timerDisplay.innerText =
    `${minutes}:${secs
      .toString()
      .padStart(2, "0")}`;
}


// =========================
// SAVE WINS
// =========================

function saveWin() {
  const box =
    document.getElementById("winInput");

  const win =
    box.value.trim();

  if (!win) return;

  const wins =
    JSON.parse(
      localStorage.getItem("wins") ||
      "[]"
    );

  wins.unshift({
    text: win,
    date: new Date().toISOString()
  });

  localStorage.setItem(
    "wins",
    JSON.stringify(
      wins.slice(0, 50)
    )
  );

  box.value = "";

  loadWins();
  checkAchievements();
  updateProgress();
  updateWeeklyInsights();

  statusText.innerText =
    "Win saved.";
}


function loadWins() {
  if (!winList) return;

  const wins =
    JSON.parse(
      localStorage.getItem("wins") ||
      "[]"
    );

  winList.innerHTML = "";

  wins
    .slice(0, 8)
    .forEach(win => {

      const li =
        document.createElement("li");

      li.innerText =
        "🏆 " +
        (win.text || win);

      winList.appendChild(li);
    });
}


// =========================
// HISTORY
// =========================

function saveHistory(text, next) {
  const history =
    JSON.parse(
      localStorage.getItem("history") ||
      "[]"
    );

  history.unshift({
    text: text,
    nextStep: next,
    date: new Date().toISOString()
  });

  localStorage.setItem(
    "history",
    JSON.stringify(
      history.slice(0, 20)
    )
  );

  loadHistory();
}


function loadHistory() {
  if (!historyList) return;

  const history =
    JSON.parse(
      localStorage.getItem("history") ||
      "[]"
    );

  historyList.innerHTML = "";

  history
    .slice(0, 8)
    .forEach(item => {

      const li =
        document.createElement("li");

      if (
        typeof item === "string"
      ) {
        li.innerText = item;
      } else {
        li.innerText =
          item.nextStep
            ? item.nextStep
            : item.text;
      }

      historyList.appendChild(li);
    });
}


// =========================
// STREAK
// =========================

function loadStreak() {
  const today =
    new Date().toDateString();

  const lastVisit =
    localStorage.getItem(
      "lastVisit"
    );

  let streak =
    parseInt(
      localStorage.getItem(
        "streak"
      ) || "0"
    );

  if (lastVisit !== today) {

    const yesterday =
      new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    if (
      lastVisit ===
      yesterday.toDateString()
    ) {
      streak++;
    } else {
      streak = 1;
    }

    localStorage.setItem(
      "streak",
      streak.toString()
    );

    localStorage.setItem(
      "lastVisit",
      today
    );
  }

  if (
    missionText &&
    (
      !missionText.innerText ||
      missionText.innerText ===
        "One small win today."
    )
  ) {

    missionText.innerText =
      `🔥 ${streak} day streak`;
  }
}


// =========================
// MOOD
// =========================

function saveMood(mood) {
  const moodData = {
    mood: mood,
    date: new Date().toISOString()
  };

  localStorage.setItem(
    "todayMood",
    JSON.stringify(moodData)
  );

  loadMood();
  updateWeeklyInsights();

  statusText.innerText =
    "Mood saved.";
}


function loadMood() {
  if (!moodStatus) return;

  const saved =
    localStorage.getItem(
      "todayMood"
    );

  if (!saved) {
    moodStatus.innerText =
      "No mood saved yet.";
    return;
  }

  const data =
    JSON.parse(saved);

  moodStatus.innerText =
    "Today’s mood: " +
    data.mood;
}


// =========================
// AUTO WINS
// =========================

function saveAutoWin(text) {
  const wins =
    JSON.parse(
      localStorage.getItem("wins") ||
      "[]"
    );

  wins.unshift({
    text: text,
    date: new Date().toISOString()
  });

  localStorage.setItem(
    "wins",
    JSON.stringify(
      wins.slice(0, 50)
    )
  );

  loadWins();
  updateProgress();
  updateWeeklyInsights();
}


// =========================
// BRAIN DUMP COUNT
// =========================

function incrementBrainDumpCount() {
  const count =
    parseInt(
      localStorage.getItem(
        "brainDumpCount"
      ) || "0"
    ) + 1;

  localStorage.setItem(
    "brainDumpCount",
    count.toString()
  );
}


// =========================
// PROGRESS
// =========================

function updateProgress() {
  const wins =
    JSON.parse(
      localStorage.getItem("wins") ||
      "[]"
    ).length;

  const brainDumps =
    parseInt(
      localStorage.getItem(
        "brainDumpCount"
      ) || "0"
    );

  const moodSaved =
    localStorage.getItem(
      "todayMood"
    )
      ? 1
      : 0;

  let score = 0;

  if (brainDumps > 0) {
    score += 35;
  }

  if (wins > 0) {
    score += 35;
  }

  if (moodSaved) {
    score += 30;
  }

  score =
    Math.min(score, 100);

  if (progressText) {
    progressText.innerText =
      score + "%";
  }
}


// =========================
// WEEKLY INSIGHTS
// =========================

function updateWeeklyInsights() {
  if (!weeklyInsights) return;

  const wins =
    JSON.parse(
      localStorage.getItem("wins") ||
      "[]"
    ).length;

  const history =
    JSON.parse(
      localStorage.getItem("history") ||
      "[]"
    ).length;

  const streak =
    localStorage.getItem(
      "streak"
    ) || "0";

  const mood =
    localStorage.getItem(
      "todayMood"
    );

  let moodText =
    "No mood saved";

  if (mood) {
    moodText =
      JSON.parse(mood).mood;
  }

  weeklyInsights.innerText =
    `🔥 Streak: ${streak} days · 🧠 Brain dumps: ${history} · 🏆 Wins: ${wins} · 😊 Mood: ${moodText}`;
}


// =========================
// ACHIEVEMENTS
// =========================

function checkAchievements() {
  const wins =
    JSON.parse(
      localStorage.getItem("wins") ||
      "[]"
    );

  if (
    wins.length >= 5 &&
    !localStorage.getItem(
      "achievementMomentum"
    )
  ) {

    localStorage.setItem(
      "achievementMomentum",
      "true"
    );

    alert(
      "🏆 Achievement Unlocked: Momentum!"
    );
  }
}


// =========================
// SERVICE WORKER
// =========================

if (
  "serviceWorker" in navigator
) {
  navigator.serviceWorker.register(
    "/static/service-worker.js"
  );
}


// =========================
// SPLASH SCREEN
// =========================

window.addEventListener(
  "load",
  () => {

    setTimeout(() => {

      const splash =
        document.getElementById(
          "splashScreen"
        );

      if (splash) {

        splash.classList.add(
          "hide"
        );

        setTimeout(() => {

          splash.style.display =
            "none";

        }, 800);
      }

    }, 2000);
  }
);
