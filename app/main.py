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

    tasks = [
        line.strip()
        for line in text.split(",")
        if line.strip()
    ]

    next_step = "Take a small first step."

    if "overwhelmed" in text.lower():
        next_step = "Choose ONE tiny thing and do it for 5 minutes."

    elif "messy" in text.lower():
        next_step = "Pick up visible trash first."

    elif "procrastinating" in text.lower():
        next_step = "Start with the easiest possible task."

    return {
        "mode": "ADHD Focus",
        "brain_dump": text,
        "organized_tasks": tasks,
        "next_step": next_step
    }
