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
            "mode": "ADHD Focus",
            "brain_dump": text,
            "organized_tasks": parsed.get("organized_tasks", []),
            "next_step": parsed.get("next_step", ""),
            "focus_plan": parsed.get("focus_plan", "")
        }

    except Exception as e:

        return {
            "mode": "ADHD Focus",
            "brain_dump": text,
            "organized_tasks": [
                "Unable to contact AI service"
            ],
            "next_step": "Check OpenAI billing or API quota.",
            "focus_plan": str(e)
        }
