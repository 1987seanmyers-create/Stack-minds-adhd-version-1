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

    status.textContent = "Done.";
  } catch (error) {
    status.textContent = "Something went wrong. Try again.";
  }
}

function startFocusSprint() {
  document.getElementById("statusText").textContent =
    "Focus Sprint started: work for 5 minutes only. Finishing is optional. Starting is the win.";
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

  wins.forEach(win => {
    const li = document.createElement("li");
    li.textContent = "✓ " + win;
    list.appendChild(li);
  });
}

loadWins();
