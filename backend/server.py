import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv(Path(__file__).parent / '.env')

# Minimal health-check backend. The traffic-light app is frontend-only; this
# service exists so the platform deployment pipeline has a backend to run.
app = FastAPI()


@app.get("/api/")
def root():
    return {"status": "ok", "app": "traffic-light"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
