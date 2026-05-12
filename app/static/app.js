async function runStackMinds() {
  const input = document.getElementById("ideaInput").value.trim();
  const status = document.getElementById("statusText");

  if (!input) {
    status.textContent = "Type a brain dump first.";
    return;
  }

  status.textContent = "Turning chaos into clarity...";

  const response = await fetch("/api/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      idea: input
    })
  });

  const data = await response.json();

  document.getElementById("brainDump").textContent =
    data.brain_dump || "";

  document.getElementById("nextStep").textContent =
    data.next_step || "Pick one small action and start for 5 minutes.";

  document.getElementById("focusPlan").textContent =
    data.focus_plan || "Do not solve everything. Start with one small visible action.";

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
}
