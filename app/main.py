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


@app.post("/api/run")
async def run_stackminds(data: BrainDump):

    text = data.idea

    prompt = f"""
You are an ADHD executive function assistant.

The user will give you a messy brain dump.

Your job:
- reduce overwhelm
- organize tasks
- identify the best next step
- create a calm focus plan
- keep advice simple and supportive

Return ONLY valid JSON in this format:

{{
  "organized_tasks": ["task 1", "task 2"],
  "next_step": "one simple next step",
  "focus_plan": "short calm focus guidance"
}}

User brain dump:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
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

    try:
        parsed = json.loads(content)

    except Exception:
        parsed = {
            "organized_tasks": [
                "Unable to organize tasks"
            ],
            "next_step": "Try again with a shorter brain dump.",
            "focus_plan": content
        }

    return {
        "mode": "ADHD Focus",
        "brain_dump": text,
        "organized_tasks": parsed.get("organized_tasks", []),
        "next_step": parsed.get("next_step", ""),
        "focus_plan": parsed.get("focus_plan", "")
    }
