
async function runStackMinds() {
  const idea = document.getElementById("ideaInput").value;

  const res = await fetch("/api/run", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({idea})
  });

  const data = await res.json();
  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
}
