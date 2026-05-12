from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static"
)


@app.get("/")
async def root():
    return FileResponse(
        BASE_DIR / "static" / "index.html"
    )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": "StackMinds AI ADHD Focus"
    }


class BrainDump(BaseModel):
    idea: str


@app.post("/api/run")
async def run_stackminds(data: BrainDump):
    text = data.idea
    lower_text = text.lower()

    tasks = [
        line.strip()
        for line in text.split(",")
        if line.strip()
    ]

    next_step = "Pick one small action and do it for 5 minutes."
    focus_plan = "Do not solve everything at once. Start with one visible action."

    if "overwhelmed" in lower_text:
        next_step = "Choose ONE tiny thing and do it for 5 minutes."
        focus_plan = "Your brain is overloaded. Do not organize everything right now. Pick one tiny visible action."

    elif "messy" in lower_text or "apartment" in lower_text or "room" in lower_text:
        next_step = "Pick up visible trash first."
        focus_plan = "Do not clean the whole place. Only handle obvious trash for 5 minutes."

    elif "procrastinating" in lower_text:
        next_step = "Start with the easiest possible task."
        focus_plan = "Lower the pressure. The goal is to begin, not finish."

    elif "app" in lower_text or "business" in lower_text:
        next_step = "Write down the one next action that moves the project forward."
        focus_plan = "Ignore the whole business for now. Pick one build step, one message, or one test."

    return {
        "mode": "ADHD Focus",
        "brain_dump": text,
        "organized_tasks": tasks,
        "next_step": next_step,
        "focus_plan": focus_plan
    }
