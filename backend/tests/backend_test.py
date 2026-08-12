"""Public API regression tests for health and neighbourhood location resolution."""

import os
import sys
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import _neighbourhood_place  # noqa: E402

frontend_env = dotenv_values(Path("/app/frontend/.env"))
base_url = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or frontend_env.get("EXPO_PUBLIC_BACKEND_URL")
if not base_url:
    raise RuntimeError("EXPO_PUBLIC_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    yield session
    session.close()


class TestServiceStatus:
    """Root and health response contract tests."""

    def test_api_root(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/", timeout=15)
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "app": "traffic-light"}

    def test_health(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/health", timeout=15)
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

class TestNeighbourhoodFallback:
    """Pure fallback-chain tests for Nominatim address variants."""

    @pytest.mark.parametrize(
        ("address", "expected"),
        [
            ({"neighbourhood": "NHCS Layout", "city": "Bengaluru"}, "NHCS Layout, Bengaluru"),
            ({"suburb": "Vijayanagar", "town": "Bangalore"}, "Vijayanagar, Bangalore"),
            ({"quarter": "Central", "municipality": "Metro"}, "Central, Metro"),
            ({"residential": "North", "village": "Village"}, "North, Village"),
            ({"city_district": "District", "county": "County"}, "District, County"),
            ({"borough": "West", "city": "City"}, "West, City"),
            ({"city": "Bengaluru", "country": "India"}, "Bengaluru, India"),
            ({}, None),
        ],
    )
    def test_address_fallback_chain(self, address, expected):
        assert _neighbourhood_place(address) == expected




class TestLocation:
    """Neighbourhood reverse-geocode, cache, and validation tests."""

    def test_location_resolves_neighbourhood_and_repeat_is_cached(self, api_client):
        payload = {"latitude": 12.9719, "longitude": 77.5330}

        first = api_client.post(f"{BASE_URL}/api/location", json=payload, timeout=20)
        assert first.status_code == 200, first.text
        first_data = first.json()
        assert set(first_data) == {"place_name", "cached"}
        assert isinstance(first_data["place_name"], str)
        assert first_data["place_name"].strip()
        assert "," in first_data["place_name"], first_data
        assert "Bengaluru" in first_data["place_name"] or "Bangalore" in first_data["place_name"], first_data
        assert isinstance(first_data["cached"], bool)

        second = api_client.post(f"{BASE_URL}/api/location", json=payload, timeout=20)
        assert second.status_code == 200, second.text
        second_data = second.json()
        assert second_data["place_name"] == first_data["place_name"]
        assert second_data["cached"] is True

    @pytest.mark.parametrize(
        "payload",
        [
            {"latitude": 100, "longitude": 77.5330},
            {"latitude": 12.9719, "longitude": 181},
            {"latitude": "not-a-number", "longitude": 77.5330},
            {"longitude": 77.5330},
        ],
    )
    def test_location_rejects_invalid_coordinates(self, api_client, payload):
        response = api_client.post(f"{BASE_URL}/api/location", json=payload, timeout=15)
        assert response.status_code == 422, response.text
        data = response.json()
        assert isinstance(data.get("detail"), list)
        assert data["detail"], data
