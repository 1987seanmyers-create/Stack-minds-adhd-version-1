from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel
from openai import OpenAI
import os
import json
import hashlib
from datetime import date

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static"
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

CACHE = {}
DAILY_USAGE = {}
AI_DAILY_LIMIT = 10


class BrainDump(BaseModel):
    idea: str


@app.get("/")
async def root():
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": "StackMinds AI ADHD Focus"
    }


def cache_key(text: str):
    return hashlib.sha256(text.lower().strip().encode()).hexdigest()


def get_user_key(request: Request):
    ip = request.client.host if request.client else "unknown"
    today = date.today().isoformat()
    return f"{ip}:{today}"


def over_daily_limit(user_key: str):
    return DAILY_USAGE.get(user_key, 0) >= AI_DAILY_LIMIT


def record_ai_use(user_key: str):
    DAILY_USAGE[user_key] = DAILY_USAGE.get(user_key, 0) + 1


def fallback_adhd_logic(text: str):
    lower = text.lower()

    tasks = [
        part.strip()
        for part in text.replace(".", ",").split(",")
        if part.strip()
    ]

    if not tasks:
        tasks = ["Breathe", "Pick one small thing", "Start for 2 minutes"]

    next_step = "Pick one tiny action and do it for 2 minutes."
    focus_plan = "Do not solve everything at once. Start small and build momentum."

    if "overwhelmed" in lower or "panic" in lower:
        next_step = "Put both feet on the floor and do one tiny visible task."
        focus_plan = "Your brain is overloaded. Do not plan your whole life right now. Do one small action."

    elif "messy" in lower or "room" in lower or "apartment" in lower:
        next_step = "Pick up visible trash first."
        focus_plan = "Do not deep clean. Only remove obvious trash or dishes for 5 minutes."

    elif "procrastinating" in lower or "can't start" in lower:
        next_step = "Start the easiest possible version of the task."
        focus_plan = "The goal is not finishing. The goal is starting."

    elif "money" in lower or "bills" in lower:
        next_step = "Write down the most urgent bill first."
        focus_plan = "Do not look at all money problems at once. Handle one immediate thing."

    elif "business" in lower or "app" in lower:
        next_step = "Pick one build step that moves the app forward today."
        focus_plan = "Ignore the whole business. Choose one task, finish it, then stop."

    return {
        "mode": "Offline ADHD Coach",
        "brain_dump": text,
        "organized_tasks": tasks,
        "next_step": next_step,
        "focus_plan": focus_plan
    }


def should_use_ai(text: str):
    lower = text.lower()

    if not client:
        return False

    if len(text.strip()) < 25:
        return False

    free_triggers = [
        "overwhelmed",
        "messy",
        "procrastinating",
        "panic",
        "room",
        "apartment"
    ]

    if any(word in lower for word in free_triggers):
        return False

    return True


def parse_ai_json(content: str):
    cleaned = content.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```", "").strip()

    return json.loads(cleaned)


@app.post("/api/run")
async def run_stackminds(data: BrainDump, request: Request):
    text = data.idea.strip()

    if not text:
        return fallback_adhd_logic("I need one small next step.")

    key = cache_key(text)

    if key in CACHE:
        cached = CACHE[key]
        cached["mode"] = "Cached AI Response"
        return cached

    fallback = fallback_adhd_logic(text)

    user_key = get_user_key(request)

    if not should_use_ai(text):
        return fallback

    if over_daily_limit(user_key):
        fallback["mode"] = "Daily AI Limit Reached"
        return fallback

    prompt = f"""
You are StackMinds AI, an ADHD executive-function assistant.

Your job:
- reduce overwhelm
- avoid shame
- organize the user's brain dump
- choose ONE clear next step
- keep the answer short
- make it feel calm and doable

Return ONLY valid JSON:

{{
  "organized_tasks": ["task 1", "task 2", "task 3"],
  "next_step": "one tiny next step",
  "focus_plan": "short calm focus plan"
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
                    "content": "You help ADHD users reduce overwhelm and take one small action."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.5
        )

        content = response.choices[0].message.content
        parsed = parse_ai_json(content)

        result = {
            "mode": "AI Coach",
            "brain_dump": text,
            "organized_tasks": parsed.get("organized_tasks", []),
            "next_step": parsed.get("next_step", fallback["next_step"]),
            "focus_plan": parsed.get("focus_plan", fallback["focus_plan"])
        }

        CACHE[key] = result
        record_ai_use(user_key)

        return result

    except Exception:
        return fallback
