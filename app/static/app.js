function quickFill(text) {
  document.getElementById("ideaInput").value = text;
}

async function runStackMinds() {
  const input = document.getElementById("ideaInput").value.trim();
  const status = document.getElementById("statusText");

  if (!input) {
    status.textContent = "Type a brain dump first.";
    return;
  }

  status.textContent = "Turning chaos into clarity...";

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({idea: input})
    });

    const data = await response.json();

    document.getElementById("nextStep").textContent =
      data.next_step || "Pick one small action and start for 5 minutes.";

    document.getElementById("missionText").textContent =
      data.next_step || "One small win today.";

    document.getElementById("focusPlan").textContent =
      data.focus_plan || "Start small. One step only.";

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    if (data.organized_tasks && data.organized_tasks.length > 0) {
      data.organized_tasks.forEach(task => {
        const li = document.createElement("li");
        li.textContent = task;
        taskList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "No tasks found.";
      taskList.appendChild(li);
    }

    saveHistory(input, data.next_step || "");
    loadHistory();

    status.textContent = "Done.";
  } catch (error) {
    status.textContent = "Something went wrong. Try again.";
  }
}

function saveWin() {
  const input = document.getElementById("winInput");
  const win = input.value.trim();

  if (!win) return;

  const wins = JSON.parse(localStorage.getItem("stackminds_wins") || "[]");
  wins.push(win);
  localStorage.setItem("stackminds_wins", JSON.stringify(wins));

  input.value = "";
  loadWins();
}

function loadWins() {
  const wins = JSON.parse(localStorage.getItem("stackminds_wins") || "[]");
  const list = document.getElementById("winList");
  list.innerHTML = "";

  wins.slice(-8).reverse().forEach(win => {
    const li = document.createElement("li");
    li.textContent = "✓ " + win;
    list.appendChild(li);
  });
}

function saveHistory(input, nextStep) {
  const history = JSON.parse(localStorage.getItem("stackminds_history") || "[]");

  history.push({
    input: input,
    nextStep: nextStep,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("stackminds_history", JSON.stringify(history.slice(-10)));
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("stackminds_history") || "[]");
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  history.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.date + " — " + item.nextStep;
    list.appendChild(li);
  });
}

function startFocusSprint() {
  let seconds = 300;
  const display = document.getElementById("timerDisplay");
  const status = document.getElementById("statusText");

  status.textContent = "Focus Sprint started. Work for 5 minutes only.";

  const timer = setInterval(() => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    display.textContent =
      minutes + ":" + String(remainingSeconds).padStart(2, "0");

    seconds--;

    if (seconds < 0) {
      clearInterval(timer);
      display.textContent = "Done";
      status.textContent = "Sprint complete. Starting was the win.";
    }
  }, 1000);
}

function startVoiceDump() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    document.getElementById("statusText").textContent =
      "Voice input is not supported on this browser.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  document.getElementById("statusText").textContent = "Listening...";

  recognition.start();

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("ideaInput").value = transcript;
    document.getElementById("statusText").textContent = "Voice dump added.";
  };

  recognition.onerror = function() {
    document.getElementById("statusText").textContent =
      "Voice input failed. Try typing instead.";
  };
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/static/service-worker.js");
}

loadWins();
loadHistory();
