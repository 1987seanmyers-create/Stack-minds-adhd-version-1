from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Stack Minds AI is running"}
