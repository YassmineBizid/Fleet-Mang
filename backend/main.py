import hashlib
import json
import os
import re
import time
from pathlib import Path
from typing import List, Optional

import cv2
import easyocr
import numpy as np
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from geopy.geocoders import Nominatim
from langchain_core.messages import HumanMessage
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from pydantic import BaseModel, validator

#load_dotenv()
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OSRM_BASE_URL = "https://router.project-osrm.org"
TEMPS_LIVRAISON_MIN = 20


app = FastAPI(title="FactureMAP API")

reader = easyocr.Reader(["fr", "en"], gpu=False)
llm = (
    ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.0,
        groq_api_key = GROQ_API_KEY
    ) 
)
geolocator = Nominatim(user_agent="facturemap_v2", timeout=10)


class Waypoint(BaseModel):
    id: str
    latitude: float
    longitude: float
    address: str
    client_name: str


class OptimizationRequest(BaseModel):
    driver_id: str
    start_latitude: float
    start_longitude: float
    waypoints: List[Waypoint]
    start_address: Optional[str] = None
    end_address: Optional[str] = None
    start_time: Optional[str] = None


class OptimizationResponse(BaseModel):
    route_id: str
    optimized_waypoints: List[Waypoint]
    total_distance_km: float
    total_duration_min: float
    polyline: str


class AddressGeocodeRequest(BaseModel):
    address: str


class AddressGeocodeResponse(BaseModel):
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    display_name: Optional[str] = None
    status: str


TN_POSTAL_CITIES = {
    "1000": "Tunis",
    "1050": "La Marsa",
    "2010": "Manouba",
    "2035": "Charguia 1",
    "2033": "Megrine",
    "2037": "Ariana",
    "2080": "Ariana",
    "3000": "Sfax Centre",
    "4000": "Sousse",
    "5000": "Monastir",
    "6000": "Sfax",
    "7000": "Bizerte",
    "8000": "Nabeul",
}

ADDRESS_ALIASES = [
    (r"\bZI\s*CHARGUIA\s*1\b", "Charguia 1 2035"),
    (r"\bZI\s*CHARGUIA\s*I\b", "Charguia 1 2035"),
    (r"\bCHARGUIA\s*1\b", "Charguia 1 2035"),
    (r"\bCHARGUIA\s*I\b", "Charguia 1 2035"),
    (r"\bMEGRINE\b", "Megrine 2033"),
    (r"\bM[\s-]*GRINE\b", "Megrine 2033"),
    (r"\bMEG[RN]INE\b", "Megrine 2033"),
]

ADDRESS_NOISE_WORDS = {
    "ADRESSE",
    "RUE",
    "AVENUE",
    "AV",
    "LOT",
    "ROUTE",
    "RT",
    "BP",
    "B",
    "P",
    "TEL",
    "FAX",
    "STE",
    "SOCIETE",
    "SARL",
    "SA",
    "SUARL",
    "TUNISIE",
}


class ExtractedInfo(BaseModel):
    label: str
    adresse: str

    @validator("adresse")
    def validate_tunisian_address(cls, value: str) -> str:
        normalized = normalize_address_candidate(value)
        match = re.search(r"\b(\d{4})\b", normalized)
        if match:
            postal = match.group(1)
            if postal in TN_POSTAL_CITIES:
                return f"{TN_POSTAL_CITIES[postal]} {postal}"
        return normalized


extraction_prompt = PromptTemplate.from_template(
    """
Vous etes un extracteur de donnees d'entreprises tunisiennes.
Retournez UNIQUEMENT un objet JSON valide, sans texte autour, sans backticks.
Format OBLIGATOIRE: {{"label": "...", "adresse": "Ville CodePostal"}}

Regles strictes:
- adresse = Ville + code postal 4 chiffres UNIQUEMENT (pas de rue)
- Corrigez les erreurs OCR: Z->2, O->0, S->5, l->1
- La ville doit etre en Tunisie
- Preserve the exact locality if it looks like a Tunisian city, even a small city or delegation
- If postal code is missing but city looks valid, return "Ville" only
- Use "Tunis 1000" only as a last resort when nothing useful is detected

Texte: {input}
JSON:
""".strip()
)

llm = None
def extract_info_colab(text_input: str) -> dict:
    if llm is None:
        print(llm)
        return extract_info_fallback(text_input)

    formatted_prompt = extraction_prompt.format(input=text_input[:800])
    response = llm.invoke([HumanMessage(content=formatted_prompt)])
    text = response.content.strip()
    text = re.sub(r"```json?\s*|\s*```", "", text).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        return extract_info_fallback(text_input)

    try:
        raw = json.loads(text[start : end + 1])
        info = ExtractedInfo(**raw)
        result = info.dict()
        result["adresse"] = normalize_address_candidate(result["adresse"])
        return result
    except Exception:
        return extract_info_fallback(text_input)


def extract_info_fallback(text_input: str) -> dict:
    cleaned_text = " ".join(text_input.split())
    address = normalize_address_candidate(cleaned_text)
    postal_match = re.search(r"\b(\d{4})\b", address)
    if not postal_match:
        city_guess = extract_locality_without_postal(cleaned_text)
        if city_guess:
            address = city_guess
        elif not address or address == cleaned_text:
            address = "Adresse a verifier"

    lines = [line.strip() for line in text_input.splitlines() if line.strip()]
    label = "Inconnu"
    for line in lines[:6]:
        if len(line) >= 3 and not re.search(r"\d{4}", line):
            label = line[:80]
            break

    return {"label": label, "adresse": address}


def prettify_city_name(value: str) -> str:
    words = []
    for raw_word in value.split():
        word = raw_word.strip("- ")
        if not word:
            continue
        if re.fullmatch(r"[IVX]+", word):
            words.append(word.upper())
        elif word.isdigit():
            words.append(word)
        else:
            words.append(word.capitalize())
    return " ".join(words)


def match_address_alias(normalized: str) -> Optional[str]:
    for pattern, replacement in ADDRESS_ALIASES:
        if re.search(pattern, normalized):
            return replacement
    return None


def extract_city_from_text(normalized: str, postal: str) -> Optional[str]:
    cleaned = re.sub(r"[^A-Z0-9\s-]", " ", normalized)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    patterns = [
        rf"([A-Z0-9\s-]{{3,}}?)\s+{postal}\b",
        rf"\b{postal}\s+([A-Z0-9\s-]{{3,}})",
    ]

    for pattern in patterns:
        match = re.search(pattern, cleaned)
        if not match:
            continue

        chunk = match.group(1).strip()
        tokens = [token for token in chunk.split() if token and token not in ADDRESS_NOISE_WORDS]
        if not tokens:
            continue

        # Keep the most local-looking tail near the postal code.
        city_tokens = tokens[-3:]
        city = " ".join(city_tokens)
        if re.search(r"[A-Z]", city):
            return prettify_city_name(city)

    return None


def extract_locality_without_postal(value: str) -> Optional[str]:
    cleaned = re.sub(r"[^A-Z0-9\s-]", " ", value.upper())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        return None

    alias_only = match_address_alias(cleaned)
    if alias_only:
        alias_city = re.sub(r"\b\d{4}\b", "", alias_only).strip()
        if alias_city:
            return alias_city

    tokens = [token for token in cleaned.split() if token and token not in ADDRESS_NOISE_WORDS]
    if not tokens:
        return None

    locality_tokens = []
    for token in tokens:
        if token.isdigit():
            continue
        if len(token) == 1 and token not in {"I", "V"}:
            continue
        locality_tokens.append(token)

    if not locality_tokens:
        return None

    candidate = " ".join(locality_tokens[-3:])
    pretty = prettify_city_name(candidate)
    return pretty if len(pretty) >= 3 else None


def normalize_address_candidate(value: str) -> str:
    normalized = " ".join(value.upper().split())

    alias_match = match_address_alias(normalized)
    if alias_match:
        return alias_match

    postal_match = re.search(r"\b(\d{4})\b", normalized)
    if postal_match:
        postal = postal_match.group(1)
        detected_city = extract_city_from_text(normalized, postal)
        if detected_city:
            return f"{detected_city} {postal}"
        city = TN_POSTAL_CITIES.get(postal)
        if city:
            if "CHARGUIA" in normalized:
                return f"Charguia 1 {postal}"
            return f"{city} {postal}"

    if "CHARGUIA" in normalized:
        return "Charguia 1 2035"
    locality_only = extract_locality_without_postal(normalized)
    if locality_only:
        return locality_only

    return value if value.strip() else "Adresse a verifier"


def preprocess_image(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    coords = np.column_stack(np.where(gray < 200))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        if abs(angle) > 0.5:
            h, w = gray.shape
            matrix = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
            gray = cv2.warpAffine(
                gray,
                matrix,
                (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )

    gray = cv2.fastNlMeansDenoising(gray, h=10)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary


GEOCACHE_FILE = Path("geocache.json")


def _load_cache() -> dict:
    if GEOCACHE_FILE.exists():
        return json.loads(GEOCACHE_FILE.read_text(encoding="utf-8"))
    return {}


def _save_cache(cache: dict) -> None:
    GEOCACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


_geocache = _load_cache()


def safe_geocode(address_str: str, retries: int = 3):
    if not address_str or address_str in ("None", ""):
        return None, None, "Adresse manquante"

    key = hashlib.md5(address_str.lower().encode()).hexdigest()
    if key in _geocache:
        entry = _geocache[key]
        return entry["lat"], entry["lon"], entry["display"]

    for attempt in range(retries):
        try:
            time.sleep(1.1)
            location = geolocator.geocode(
                f"{address_str}, Tunisie",
                language="fr",
                country_codes="tn",
            )
            if location:
                _geocache[key] = {
                    "lat": location.latitude,
                    "lon": location.longitude,
                    "display": location.address,
                }
                _save_cache(_geocache)
                return location.latitude, location.longitude, location.address
        except Exception:
            if attempt < retries - 1:
                time.sleep(2**attempt)

    try:
        response = requests.get(
            "https://photon.komoot.io/api/",
            params={
                "q": address_str,
                "lang": "fr",
                "limit": 1,
                "bbox": "7.5,30.2,11.6,37.4",
            },
            timeout=8,
        )
        features = response.json().get("features", [])
        if features:
            coords = features[0]["geometry"]["coordinates"]
            return coords[1], coords[0], address_str
    except Exception:
        pass

    return None, None, "Non trouve"


def get_osrm_table(points):
    coords_str = ";".join(f"{point['lon']},{point['lat']}" for point in points)
    url = f"{OSRM_BASE_URL}/table/v1/driving/{coords_str}?annotations=distance,duration"
    try:
        response = requests.get(url, timeout=15)
        data = response.json()
        if data.get("code") == "Ok":
            return np.array(data["distances"]) / 1000.0, np.array(data["durations"]) / 60.0
        return None, None
    except Exception as exc:
        print(f"OSRM Error: {exc}")
        return None, None


def solve_tsp(matrix_int, has_end_node: bool = False):
    n = len(matrix_int)
    if has_end_node:
        manager = pywrapcp.RoutingIndexManager(n, 1, [0], [n - 1])
    else:
        manager = pywrapcp.RoutingIndexManager(n, 1, 0)

    routing = pywrapcp.RoutingModel(manager)

    def transit_callback(from_idx, to_idx):
        return matrix_int[manager.IndexToNode(from_idx)][manager.IndexToNode(to_idx)]

    callback_idx = routing.RegisterTransitCallback(transit_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(callback_idx)

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.seconds = 5

    solution = routing.SolveWithParameters(search_params)
    if not solution:
        return None

    route = []
    idx = routing.Start(0)
    while not routing.IsEnd(idx):
        route.append(manager.IndexToNode(idx))
        idx = solution.Value(routing.NextVar(idx))
    return route


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/ocr/invoice")
async def process_invoice_ocr(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Image invalide")

        processed = preprocess_image(img)
        results = reader.readtext(processed, detail=0)
        text_input = "\n".join(results).strip()

        if not text_input.strip():
            raise HTTPException(status_code=400, detail="Aucun texte detecte")

        info = extract_info_colab(text_input)
        address_to_geocode = info.get("adresse", "")
        lat, lon, _ = safe_geocode(address_to_geocode)

        return {
            "client_name": info.get("label", "Inconnu"),
            "address": info.get("adresse", "Non trouve"),
            "latitude": lat,
            "longitude": lon,
            "status": "success" if lat else "failed_geocoding",
        }
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Server Error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/geocode/address", response_model=AddressGeocodeResponse)
async def geocode_address(request: AddressGeocodeRequest):
    try:
        address = request.address.strip()
        if not address:
            raise HTTPException(status_code=400, detail="Adresse manquante")

        lat, lon, display_name = safe_geocode(address)
        return {
            "address": address,
            "latitude": lat,
            "longitude": lon,
            "display_name": display_name,
            "status": "success" if lat is not None and lon is not None else "failed",
        }
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Geocoding Error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/optimize-route", response_model=OptimizationResponse)
async def optimize_route(request: OptimizationRequest):
    try:
        start_lat = request.start_latitude
        start_lon = request.start_longitude

        if request.start_address and request.start_address.strip():
            lat, lon, _ = safe_geocode(request.start_address)
            if lat is not None and lon is not None:
                start_lat = lat
                start_lon = lon

        points = [{"lat": start_lat, "lon": start_lon, "id": "start"}]
        for waypoint in request.waypoints:
            points.append({"lat": waypoint.latitude, "lon": waypoint.longitude, "id": waypoint.id})

        has_end_node = False
        if request.end_address and request.end_address.strip():
            lat, lon, _ = safe_geocode(request.end_address)
            if lat is not None and lon is not None:
                points.append({"lat": lat, "lon": lon, "id": "end"})
                has_end_node = True

        dist_matrix, dur_matrix = get_osrm_table(points)
        if dist_matrix is None:
            return {
                "route_id": f"route-{int(time.time())}",
                "optimized_waypoints": request.waypoints,
                "total_distance_km": 0,
                "total_duration_min": 0,
                "polyline": "",
            }

        dur_matrix_int = (dur_matrix * 100).astype(int).tolist()
        best_order_indices = solve_tsp(dur_matrix_int, has_end_node=has_end_node)
        if not best_order_indices:
            raise Exception("Echec de l'optimisation")

        optimized_waypoints = []
        ordered_points_for_polyline = [points[0]]
        total_dist = 0.0
        total_dur = 0.0
        waypoint_offset = 1
        waypoint_count = len(request.waypoints)

        for index in range(len(best_order_indices) - 1):
            current_idx = best_order_indices[index]
            next_idx = best_order_indices[index + 1]
            total_dist += dist_matrix[current_idx][next_idx]
            total_dur += dur_matrix[current_idx][next_idx]

            waypoint_index = next_idx - waypoint_offset
            if 0 <= waypoint_index < waypoint_count:
                ordered_points_for_polyline.append(points[next_idx])
                optimized_waypoints.append(request.waypoints[waypoint_index])
            elif has_end_node and next_idx == len(points) - 1:
                ordered_points_for_polyline.append(points[next_idx])

        total_dur += len(optimized_waypoints) * TEMPS_LIVRAISON_MIN

        coords_str = ";".join(f"{point['lon']},{point['lat']}" for point in ordered_points_for_polyline)
        route_url = f"{OSRM_BASE_URL}/route/v1/driving/{coords_str}?overview=full"
        route_response = requests.get(route_url, timeout=15).json()
        polyline = route_response["routes"][0]["geometry"] if route_response.get("code") == "Ok" else ""

        return {
            "route_id": f"route-{int(time.time())}",
            "optimized_waypoints": optimized_waypoints,
            "total_distance_km": round(total_dist, 2),
            "total_duration_min": int(total_dur),
            "polyline": polyline,
        }
    except Exception as exc:
        print(f"Optimization Error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
