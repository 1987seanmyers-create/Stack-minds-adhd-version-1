from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel
from openai import OpenAI
import os
import json

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static"
)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
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


def fallback_adhd_logic(text: str):
    lower_text = text.lower()

    tasks = [
        line.strip()
        for line in text.split(",")
        if line.strip()
    ]

    next_step = "Pick one small thing and work on it for 5 minutes."
    focus_plan = "Do not solve everything at once. Reduce overwhelm first."

    if "overwhelmed" in lower_text:
        next_step = "Choose ONE tiny thing and do it for only 5 minutes."
        focus_plan = (
            "Your brain is overloaded right now. "
            "Do not try to organize your whole life. "
            "Pick one tiny visible action."
        )

    elif "messy" in lower_text or "room" in lower_text or "apartment" in lower_text:
        next_step = "Pick up visible trash first."
        focus_plan = (
            "Ignore deep cleaning. "
            "Only remove obvious trash or dirty dishes first."
        )

    elif "procrastinating" in lower_text:
        next_step = "Start with the easiest possible task."
        focus_plan = (
            "Momentum matters more than perfection. "
            "Starting is the win."
        )

    elif "money" in lower_text or "bills" in lower_text:
        next_step = "List your most urgent bill first."
        focus_plan = (
            "Do not think about all finances at once. "
            "Handle one immediate problem first."
        )

    elif "app" in lower_text or "business" in lower_text:
        next_step = "Write down ONE task that moves the project forward."
        focus_plan = (
            "Ignore the entire business for now. "
            "Focus only on the next build step."
        )

    elif "tired" in lower_text or "burned out" in lower_text:
        next_step = "Drink water and rest for 15 minutes."
        focus_plan = (
            "Burnout is not laziness. "
            "Reduce pressure before trying to perform."
        )

    return {
        "mode": "ADHD Focus — Free Logic",
        "brain_dump": text,
        "organized_tasks": tasks,
        "next_step": next_step,
        "focus_plan": focus_plan
    }


@app.post("/api/run")
async def run_stackminds(data: BrainDump):

    text = data.idea

    prompt = f"""
You are an ADHD executive function assistant.

Help reduce overwhelm.
Keep responses short, calm, and actionable.

Return ONLY valid JSON:

{{
  "organized_tasks": ["task"],
  "next_step": "one step",
  "focus_plan": "short focus guidance"
}}

User brain dump:
{text}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You help ADHD users reduce overwhelm."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7
        )

        content = response.choices[0].message.content
        parsed = json.loads(content)

        return {
            "mode": "ADHD Focus — AI",
            "brain_dump": text,
            "organized_tasks": parsed.get("organized_tasks", []),
            "next_step": parsed.get("next_step", ""),
            "focus_plan": parsed.get("focus_plan", "")
        }

    except Exception:
        return fallback_adhd_logic(text)
