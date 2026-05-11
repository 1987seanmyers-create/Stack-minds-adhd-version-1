from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


@app.get("/")
async def root():
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": "StackMinds AI ADHD Focus"
    }
from pydantic import BaseModel


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

    return {
        "mode": "ADHD Focus",
        "brain_dump": text,
        "organized_tasks": tasks,
        "next_step": tasks[0] if tasks else "No tasks found"
    }
