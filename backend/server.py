import time
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).parent / '.env')

app = FastAPI()

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "traffic-light-app/1.0 (emergent preview app)"
CACHE_TTL = 6 * 60 * 60  # seconds

# In-memory cache keyed by ~110m coordinate buckets (privacy + Nominatim policy).
_cache: dict = {}


class LocationIn(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class LocationOut(BaseModel):
    place_name: Optional[str]
    cached: bool = False


def _neighbourhood_place(address: dict) -> Optional[str]:
    hood = (
        address.get("neighbourhood")
        or address.get("suburb")
        or address.get("quarter")
        or address.get("residential")
        or address.get("city_district")
        or address.get("borough")
    )
    city = (
        address.get("city")
        or address.get("town")
        or address.get("municipality")
        or address.get("village")
        or address.get("county")
    )
    if hood and city:
        return f"{hood}, {city}"
    if city:
        country = address.get("country")
        return f"{city}, {country}" if country else city
    return None


@app.get("/api/")
def root():
    return {"status": "ok", "app": "traffic-light"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}


@app.post("/api/location", response_model=LocationOut)
async def resolve_location(body: LocationIn):
    key = f"{round(body.latitude, 3):.3f}:{round(body.longitude, 3):.3f}"
    hit = _cache.get(key)
    if hit and time.time() - hit["at"] < CACHE_TTL:
        return LocationOut(place_name=hit["place_name"], cached=True)

    params = {
        "lat": body.latitude,
        "lon": body.longitude,
        "format": "jsonv2",
        "zoom": 16,  # neighbourhood-level detail
        "addressdetails": 1,
        "accept-language": "en",
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(NOMINATIM_URL, params=params, headers={"User-Agent": USER_AGENT})
            resp.raise_for_status()
            result = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(502, "reverse geocoder unavailable") from exc

    place_name = _neighbourhood_place(result.get("address", {})) or result.get("display_name")
    if len(_cache) > 2048:
        now = time.time()
        for k in [k for k, v in _cache.items() if now - v["at"] >= CACHE_TTL]:
            _cache.pop(k, None)
    _cache[key] = {"place_name": place_name, "at": time.time()}
    return LocationOut(place_name=place_name)
