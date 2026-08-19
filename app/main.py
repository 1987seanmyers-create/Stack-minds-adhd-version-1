from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# =========================
# PAGES
# =========================

@app.get("/")
async def root():
    return FileResponse(
        BASE_DIR / "static" / "index.html"
    )


@app.get("/settings")
async def settings():
    return FileResponse(
        BASE_DIR / "static" / "settings.html"
    )


@app.get("/stats")
async def stats():
    return FileResponse(
        BASE_DIR / "static" / "stats.html"
    )


@app.get("/export")
async def export():
    return FileResponse(
        BASE_DIR / "static" / "export.html"
    )


@app.get("/privacy")
async def privacy():
    return FileResponse(
        BASE_DIR / "static" / "privacy.html"
    )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": "StackMinds AI ADHD Focus",
        "ai_configured": bool(client)
    }


# =========================
# CACHE + DAILY LIMIT
# =========================

def cache_key(text: str):
    return hashlib.sha256(
        text.lower().strip().encode()
    ).hexdigest()


def get_user_key(request: Request):
    ip = (
        request.client.host
        if request.client
        else "unknown"
    )

    today = date.today().isoformat()

    return f"{ip}:{today}"


def over_daily_limit(user_key: str):
    return (
        DAILY_USAGE.get(user_key, 0)
        >= AI_DAILY_LIMIT
    )


def record_ai_use(user_key: str):
    DAILY_USAGE[user_key] = (
        DAILY_USAGE.get(user_key, 0) + 1
    )


# =========================
# OFFLINE / FALLBACK LOGIC
# =========================

def fallback_adhd_logic(text: str):

    lower = text.lower()

    tasks = [
        part.strip()
        for part in text.replace(".", ",").split(",")
        if part.strip()
    ]

    if not tasks:
        tasks = [
            "Take one breath",
            "Pick one small task",
            "Start for 5 minutes"
        ]

    next_step = (
        "Choose the easiest useful task "
        "and work on it for 5 minutes."
    )

    focus_plan = (
        "Ignore everything else for now. "
        "Work only on this one action until "
        "the timer ends."
    )

    focus_minutes = 5

    if (
        "overwhelmed" in lower
        or "panic" in lower
    ):
        next_step = (
            "Put both feet on the floor, "
            "take one slow breath, and complete "
            "one tiny visible task."
        )

        focus_plan = (
            "Your only job right now is one "
            "small action. Do not try to solve "
            "everything at once."
        )

    elif (
        "messy" in lower
        or "room" in lower
        or "apartment" in lower
        or "house" in lower
    ):
        next_step = (
            "Choose one small area and remove "
            "only visible trash or dishes "
            "for 5 minutes."
        )

        focus_plan = (
            "Do not deep clean. Work on only "
            "that small area until the timer ends."
        )

    elif (
        "procrastinating" in lower
        or "can't start" in lower
        or "cannot start" in lower
    ):
        next_step = (
            "Open or prepare the task you have "
            "been avoiding and work on the easiest "
            "part for 5 minutes."
        )

        focus_plan = (
            "The goal is not to finish. "
            "The goal is only to start."
        )

    elif (
        "money" in lower
        or "bill" in lower
        or "bills" in lower
        or "bank" in lower
    ):
        next_step = (
            "Identify the most urgent money task "
            "and take the first action on it now."
        )

        focus_plan = (
            "Handle one financial issue only. "
            "Ignore the rest until this step is done."
        )

    elif (
        "business" in lower
        or "app" in lower
        or "stack minds" in lower
        or "stackminds" in lower
    ):
        next_step = (
            "Choose one specific app task that "
            "can be moved forward in 10 minutes "
            "and start it now."
        )

        focus_plan = (
            "Do not work on the entire project. "
            "Complete one small build step."
        )

        focus_minutes = 10

    then_do_this = tasks[1:4]

    can_wait = (
        tasks[4:]
        if len(tasks) > 4
        else []
    )

    return {
        "mode": "Offline ADHD Coach",
        "brain_dump": text,
        "organized_tasks": tasks,
        "next_step": next_step,
        "then_do_this": then_do_this,
        "can_wait": can_wait,
        "focus_minutes": focus_minutes,
        "focus_plan": focus_plan
    }


# =========================
# AI JSON PARSER
# =========================

def parse_ai_json(content: str):

    cleaned = content.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[
            len("```json"):
        ].strip()

    elif cleaned.startswith("```"):
        cleaned = cleaned[3:].strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    return json.loads(cleaned)


# =========================
# STACK MINDS AI
# =========================

@app.post("/api/run")
async def run_stackminds(
    data: BrainDump,
    request: Request
):

    text = data.idea.strip()

    if not text:
        return fallback_adhd_logic(
            "I need one small next step."
        )

    fallback = fallback_adhd_logic(text)

    if not client:
        fallback["mode"] = (
            "AI Not Configured - Fallback"
        )
        return fallback

    key = cache_key(text)

    if key in CACHE:
        cached = dict(CACHE[key])
        cached["mode"] = "Cached AI Response"
        return cached

    user_key = get_user_key(request)

    if over_daily_limit(user_key):
        fallback["mode"] = (
            "Daily AI Limit Reached"
        )
        return fallback


    prompt = f"""
You are StackMinds AI, an ADHD executive-function assistant.

STACK MINDS PURPOSE:

Turn mental chaos into immediate clarity.

The user may type a messy, emotional, incomplete,
random, scattered, or overwhelming brain dump.

The user should NOT have to organize their thoughts
before using StackMinds.

Organizing the chaos is your job.


IMPORTANT RULES:

1. Read the entire brain dump.

2. Identify all real tasks, responsibilities,
   worries, errands, or actions.

3. Organize the useful tasks into a clear list.

4. Decide what deserves attention first.

5. Choose ONE specific action the user can begin
   immediately.

6. The first action must be small and concrete.

7. Never tell the user to solve everything at once.

8. Never shame, lecture, criticize, or overwhelm
   the user.

9. Avoid long explanations.

10. Prefer physical, concrete actions over vague
    motivational advice.

11. If something is clearly urgent or
    time-sensitive, prioritize it.

12. If nothing is clearly urgent, choose the task
    most likely to create useful momentum.

13. Break large tasks into very small actions.

14. "then_do_this" may contain a maximum
    of 3 actions.

15. Put lower-priority or non-urgent items
    into "can_wait".

16. Choose a focus sprint of only:
    5, 10, or 15 minutes.

17. Do not automatically choose cleaning.
    Only choose cleaning if it actually makes sense
    based on the user's brain dump.

18. Do not automatically choose the first thing
    the user typed. Think about priority.

19. Do not use complicated productivity jargon.

20. The answer should make an overwhelmed person
    immediately understand what to do next.


NEXT STEP EXAMPLES:

BAD:
"Work on your app."

GOOD:
"Open your Stack Minds project and fix one button
for 10 minutes."


BAD:
"Clean the house."

GOOD:
"Pick up visible trash in the kitchen for
5 minutes."


BAD:
"Handle your finances."

GOOD:
"Open your banking app and check the balance
before doing anything else."


BAD:
"Get organized."

GOOD:
"Write the three things that must be done today
and circle the most urgent one."


Return ONLY valid JSON.

Do not add markdown.

Do not add explanations before or after the JSON.

Return exactly this structure:

{{
    "organized_tasks": [
        "task 1",
        "task 2",
        "task 3"
    ],

    "next_step":
        "one extremely specific action to do now",

    "then_do_this": [
        "next action",
        "next action"
    ],

    "can_wait": [
        "lower priority task"
    ],

    "focus_minutes": 5,

    "focus_plan":
        "one short instruction for completing the focus sprint"
}}


USER BRAIN DUMP:

{text}
"""


    try:

        response = client.chat.completions.create(
            model="gpt-4o-mini",

            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are StackMinds AI. "
                        "You help ADHD users turn "
                        "mental chaos into one clear "
                        "next action. "
                        "Keep responses short, "
                        "specific, calm, and useful. "
                        "Return only valid JSON."
                    )
                },

                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.4
        )


        content = (
            response.choices[0]
            .message.content
            or ""
        )


        parsed = parse_ai_json(content)


        focus_minutes = parsed.get(
            "focus_minutes",
            fallback["focus_minutes"]
        )

        if focus_minutes not in [5, 10, 15]:
            focus_minutes = 5


        result = {

            "mode":
                "AI Coach",

            "brain_dump":
                text,

            "organized_tasks":
                parsed.get(
                    "organized_tasks",
                    fallback["organized_tasks"]
                ),

            "next_step":
                parsed.get(
                    "next_step",
                    fallback["next_step"]
                ),

            "then_do_this":
                parsed.get(
                    "then_do_this",
                    fallback["then_do_this"]
                )[:3],

            "can_wait":
                parsed.get(
                    "can_wait",
                    fallback["can_wait"]
                ),

            "focus_minutes":
                focus_minutes,

            "focus_plan":
                parsed.get(
                    "focus_plan",
                    fallback["focus_plan"]
                )
        }


        CACHE[key] = result

        record_ai_use(user_key)

        return result


    except Exception as e:

        print(
            "OPENAI ERROR:",
            str(e)
        )

        fallback["mode"] = (
            "AI Error - Fallback"
        )

        return fallback
