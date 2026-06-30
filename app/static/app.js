const input = document.getElementById("ideaInput");
const status = document.getElementById("statusText");
const nextStep = document.getElementById("nextStep");
const focusPlan = document.getElementById("focusPlan");
const taskList = document.getElementById("taskList");
const historyList = document.getElementById("historyList");
const winList = document.getElementById("winList");
const missionText = document.getElementById("missionText");

loadWins();
loadHistory();

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

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                idea: text
            })

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

        status.innerText = "Done.";

    }

    catch (err) {

        status.innerText = "Offline Mode";

        nextStep.innerText =
            "Choose one tiny task and spend only two minutes on it.";

        focusPlan.innerText =
            "No AI available. Stay focused for five minutes.";

        taskList.innerHTML = `
        <li>Drink water</li>
        <li>Clear one small space</li>
        <li>Do one task for five minutes</li>
        `;

    }

}

function quickFill(text) {

    input.value = text;

}

function saveWin() {

    const box = document.getElementById("winInput");

    if (box.value === "") return;

    let wins =
        JSON.parse(localStorage.getItem("wins")) || [];

    wins.unshift(box.value);

    localStorage.setItem(
        "wins",
        JSON.stringify(wins)
    );

    box.value = "";

    loadWins();

}

function loadWins() {

    let wins =
        JSON.parse(localStorage.getItem("wins")) || [];

    winList.innerHTML = "";

    wins.forEach(win => {

        const li = document.createElement("li");

        li.innerText = "🏆 " + win;

        winList.appendChild(li);

    });

}

function saveHistory(text) {

    let history =
        JSON.parse(localStorage.getItem("history")) || [];

    history.unshift(text);

    history = history.slice(0, 20);

    localStorage.setItem(
        "history",
        JSON.stringify(history)
    );

    loadHistory();

}

function loadHistory() {

    let history =
        JSON.parse(localStorage.getItem("history")) || [];

    historyList.innerHTML = "";

    history.forEach(item => {

        const li = document.createElement("li");

        li.innerText = item;

        historyList.appendChild(li);

    });

}

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

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        seconds % 60;

    document.getElementById("timerDisplay").innerText =
        `${minutes}:${secs.toString().padStart(2, "0")}`;

}

function startVoiceDump() {

    if (!("webkitSpeechRecognition" in window)) {

        alert("Speech recognition not supported.");

        return;

    }

    const recognition =
        new webkitSpeechRecognition();

    recognition.lang = "en-US";

    recognition.onresult = function(event) {

        input.value =
            event.results[0][0].transcript;

    };

    recognition.start();

}
