!pip install pytesseract pillow

!pip install ortools geopy folium requests pandas numpy -q
!pip install easyocr
print("✅ Dépendances installées")

!pip install langchain_community langgraph langchain_openai langchain_groq

!pip install ortools

from langgraph.graph import StateGraph, END , START
from langgraph.graph.message import MessagesState
from langgraph.checkpoint.memory import MemorySaver , InMemorySaver
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage, AIMessage , SystemMessage
from langchain_groq import ChatGroq

import uuid

import glob
from PIL import Image
import pytesseract
import re
import json

import time
import math
import json
import datetime
import numpy as np
import pandas as pd
import requests
import folium
from IPython.display import display
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

import os
api_key = os.getenv("GROQ_API_KEY", "YOUR_API_KEY_HERE")

from langchain_groq import ChatGroq
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.0,
    max_retries=2,
    groq_api_key=api_key
)

# import json
# from typing import Optional
# from langchain_openai import ChatOpenAI
# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import PydanticOutputParser

# from pydantic import BaseModel, Field
# # --- 1. Définition de la structure attendue ---
# class CompanyInfo(BaseModel):
#     label: str = Field(description="Nom de l'entreprise ou 'company name non available'")
#     adresse: str = Field(description="Ville et code postal uniquement (Tunisie), ou 'adress non available'")

# # --- 2. Configuration du parseur et du prompt ---
# parser = PydanticOutputParser(pydantic_object=CompanyInfo)

# template = """
# You are an AI assistant specialized in Tunisian corporate data extraction.
# Extract information from the following OCR text.

# Rules:
# - Correct misspelled city names in Tunisia.
# - Append the correct 4-digit postal code if missing.
# - Ignore street names.
# - If not found, use the specific placeholders: 'company name non available' or 'adress non available'.

# {format_instructions}

# Text:
# {input}
# """

# prompt = PromptTemplate(
#     template=template,
#     input_variables=["input"],
#     partial_variables={"format_instructions": parser.get_format_instructions()}
# )

# # --- 3. Fonction d'extraction simplifiée ---
# def extract_complaint_info(text: str):


#     # La chaîne de traitement : Prompt -> LLM -> Parseur
#     chain = prompt | llm | parser

#     try:
#         return chain.invoke({"input": text})
#     except Exception as e:
#         print(f"Erreur de parsing : {e}")
#         return CompanyInfo(label="None", adresse="None")

# # --- 4. Boucle d'OCR optimisée ---
# ADRESSES = []
# for img_path in glob.glob("/content/*"):
#     if img_path.lower().endswith((".png",".jpg",".jpeg")):
#         img = Image.open(img_path).convert("L")

#         # Amélioration OCR : configuration pour détecter des blocs de texte
#         custom_config = r'--oem 3 --psm 6'
#         text = pytesseract.image_to_string(img, lang="fra+eng", config=custom_config)

#         infos = extract_complaint_info(text)
#         ADRESSES.append(infos.model_dump()) # Convertit l'objet Pydantic en dictionnaire

# print(ADRESSES)

!pip install easyocr

# import glob
# import cv2
# import easyocr
# import json
# from pydantic import BaseModel, Field
# from langchain_openai import ChatOpenAI
# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import PydanticOutputParser


# # Initialiser le lecteur. 'fr' inclut le français, 'en' l'anglais.
# # Il télécharge les modèles lors du premier lancement.
# reader = easyocr.Reader(['fr', 'en'], gpu=False)

# class CompanyInfo(BaseModel):
#     label: str = Field(description="Nom de l'entreprise ou 'company name non available'")
#     adresse: str = Field(description="Ville et code postal uniquement (Tunisie), ou 'adress non available'")

# parser = PydanticOutputParser(pydantic_object=CompanyInfo)

# template = """
# Tu es un expert en données d'entreprise tunisiennes. Ta tâche est d'extraire le NOM et l'ADRESSE (uniquement Ville + CP) depuis le texte brut OCR d'une PHOTO de smartphone.

# Règles :
# 1. Ignore les noms de rue, garde VILLE et CODE POSTAL (4 chiffres).
# 2. Si le nom de la ville semble mal écrit (erreur OCR), corrige-le (ex: "Tunls" -> "Tunis").
# 3. Si le code postal est manquant mais la ville est claire, essaie de deviner le code postal générique de cette ville en Tunisie (ex: "Ariana" -> "2080").
# 4. Si introuvable, utilise "company name non available" ou "adress non available".

# {format_instructions}

# Texte OCR :
# {input}
# """

# prompt = PromptTemplate(
#     template=template,
#     input_variables=["input"],
#     partial_variables={"format_instructions": parser.get_format_instructions()}
# )

# # Configuration du LLM (on garde temperature=0 pour la précision)

# chain = prompt | llm | parser

# # ==========================================
# # 3. Boucle d'exécution
# # ==========================================
# ADRESSES = []


# paths = glob.glob("/content/*.jpg") + glob.glob("/content/*.png") + glob.glob("/content/*.jpeg")

# for img_path in paths:
#     print(f"Traitement de {img_path}...")
#     try:
#         # --- ÉTAPE OCR (EasyOCR est beaucoup plus tolérant) ---
#         # detail=0 retourne une liste de chaînes de caractères sans coordonnées
#         results = reader.readtext(img_path, detail=0)

#         # On joint tout le texte détecté avec des espaces pour le LLM
#         text_brut = " ".join(results)

#         if not text_brut.strip():
#             print(f"⚠️ Aucun texte détecté sur {img_path}")
#             continue

#         print(f"DEBUG OCR TEXT: {text_brut}") # Décommente pour voir ce que l'OCR lit

#         # --- ÉTAPE LLM & Extraction ---
#         infos = chain.invoke({"input": text_brut})

#         # model_dump() remplace .dict() dans Pydantic V2
#         ADRESSES.append(infos.model_dump())

#     except Exception as e:
#         print(f"❌ Erreur lors du traitement de {img_path}: {e}")

# # ==========================================
# # 4. Affichage propre du résultat JSON
# # ==========================================
# print("\n--- RÉSULTAT FINAL ---")
# print(json.dumps(ADRESSES, indent=4, ensure_ascii=False))

extraction_prompt = PromptTemplate.from_template("""
You are an AI assistant that extracts structured company information from text.

Your task is to identify:
1. The company name
2. The company address

Address must contain ONLY:
- city
- postal code

Rules:
- Return ONLY a valid Python dictionary.
- Do NOT add explanations or extra text.
- If the company name is not found, return: "company name non available".
- If the address is not found, return: "adress non available".
- If the city name appears misspelled or incorrect, correct it to the most likely valid city name.
- Add the correct postal code to the city in Tunisia
- Ignore street names and keep only city and postal code when possible.

Output format:
{{"label": "company name", "adresse": "city postal_code"}}

Text:
{input}
""")

def extract_info(input: str):
    formatted_prompt = extraction_prompt.format(input=input)
    response = llm.invoke([HumanMessage(content=formatted_prompt)])
    text = response.content

    code_blocks = re.findall(r'```(json)?\n(.*?)```', text, re.DOTALL)
    if code_blocks:
        json_text = code_blocks[0][1].strip()
    else:
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_text = text[start:end+1].strip()
        else:
            print("No JSON found in response.")
            print("Raw response:", text)
            return {"label": "None", "adresse": "None"}
            #, "phone": "None", "order_number": "None"}

    try:
        info = json.loads(json_text)
    except json.JSONDecodeError:
        if not json_text.endswith('}'):
            json_text_fixed = json_text + "}"
            try:
                info = json.loads(json_text_fixed)
            except Exception as e:
                print("Failed to parse JSON even after fix:", e)
                print("Raw JSON text:", json_text)
                return {"label": "None", "adresse": "None", }
        else:
            print("JSON parsing error.")
            print("Raw JSON text:", json_text)
            return {"label": "None", "adresse": "None", }

    for key in ["label", "adresse"]:
        if key not in info or info[key] is None or info[key] == "":
            info[key] = "None"

    return info

# import glob
# from PIL import Image
# import easyocr
# import re

# folder_path = r"/content/*"
# ADRESSES =[]
# for img_path in glob.glob(folder_path):
#   if img_path.lower().endswith((".png",".jpg",".jpeg",".bmp")):
#     reader = easyocr.Reader(['fr', 'en',])  # langues à supporter
#     results = reader.readtext(img_path)
#     input = [res[1] for res in results]
#     print(input)


#     infos = extract_info(input)
#     ADRESSES.append(infos)

# print(ADRESSES)

ADRESSES = []

for img_path in glob.glob("/content/*"):

    if img_path.lower().endswith((".png",".jpg",".jpeg",".bmp")):

        img = Image.open(img_path).convert("L")  # grayscale

        text = pytesseract.image_to_string(img, lang="fra+eng")

        lines = [l.strip() for l in text.split("\n") if l.strip()]

        print("OCR TEXT:", lines)

        infos = extract_info("\n".join(lines))

        ADRESSES.append(infos)

print(ADRESSES)

DEPOT = {
    "label": "Entrepôt principal",
    "adresse": "Avenue de Carthage, Tunis, Tunisie 1000"
}


# Heure de départ du camion
HEURE_DEPART = "08:00"

TEMPS_LIVRAISON_MIN = 20

# OSRM public server (gratuit, sans clé API)
# Pour usage intensif en production, héberger son propre serveur OSRM
OSRM_BASE_URL = "https://router.project-osrm.org"

print(f"✅ Configuration chargée : 1 dépôt + {len(ADRESSES)} adresses de livraison")
print(f"   Heure de départ : {HEURE_DEPART}")
print(f"   Serveur OSRM    : {OSRM_BASE_URL}")

geolocator = Nominatim(user_agent="routeopt_colab_v2", timeout=10)

def geocoder_adresse(adresse_str, retries=3):
    """Géocode une adresse avec retry automatique."""
    for attempt in range(retries):
        try:
            location = geolocator.geocode(adresse_str, language="fr")
            if location:
                return location.latitude, location.longitude, location.address
            return None, None, "Non trouvé"
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                return None, None, f"Erreur: {e}"

# ── Géocoder le dépôt ──
print("📍 Géocodage du dépôt...")
lat, lon, label = geocoder_adresse(DEPOT["adresse"])
if lat:
    DEPOT["lat"] = lat
    DEPOT["lon"] = lon
    DEPOT["label_full"] = label
    print(f"   ✅ Dépôt → ({lat:.5f}, {lon:.5f})")
else:
    raise ValueError(f"❌ Dépôt introuvable : {DEPOT['adresse']}")

time.sleep(1.2)

# ── Géocoder les livraisons ──
print(f"\n📍 Géocodage de {len(ADRESSES)} adresses...")
print("-" * 65)

geocoded = []
erreurs  = []

for i, item in enumerate(ADRESSES):
    lat, lon, label = geocoder_adresse(item["adresse"])
    if lat:
        entry = {**item, "lat": lat, "lon": lon, "label_full": label, "status": "ok"}
        geocoded.append(entry)
        print(f"   [{i+1:02d}] ✅ {item['adresse'][:45]:<46} ({lat:.4f}, {lon:.4f})")
    else:
        erreurs.append({**item, "lat": None, "lon": None, "status": "erreur"})
        print(f"   [{i+1:02d}] ❌ {item['adresse'][:45]:<46} {label}")
    time.sleep(1.2)

print("-" * 65)
print(f"✅ {len(geocoded)} succès   ❌ {len(erreurs)} échec(s)")

tous_points = [DEPOT] + geocoded
n = len(tous_points)
print(f"\n📌 Total points (dépôt + livraisons) : {n}")

def osrm_table(points, base_url=OSRM_BASE_URL):
    """
    Appelle OSRM /table/v1/driving avec tous les points.
    Retourne (distance_matrix_km, duration_matrix_min) ou (None, None) si erreur.

    OSRM Table API :
      - coordinates : lon,lat;lon,lat;...
      - annotations : distance,duration
      - distances   : en mètres
      - durations   : en secondes
    """
    # Format coords : lon,lat séparés par ;
    coords_str = ";".join(f"{p['lon']},{p['lat']}" for p in points)
    url = f"{base_url}/table/v1/driving/{coords_str}?annotations=distance,duration"

    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") != "Ok":
            print(f"   ⚠️  OSRM erreur : {data.get('message', 'inconnu')}")
            return None, None

        # distances en mètres → km
        dist_m  = np.array(data["distances"])
        dur_s   = np.array(data["durations"])

        dist_km = dist_m / 1000.0
        dur_min = dur_s  / 60.0

        return dist_km, dur_min

    except requests.exceptions.RequestException as e:
        print(f"   ⚠️  OSRM indisponible : {e}")
        return None, None

print("🛣️  Calcul de la matrice OSRM (distances routières réelles)...")
print(f"   {n} points → {n*n} paires")

dist_km_osrm, dur_min_osrm = osrm_table(tous_points)

if dist_km_osrm is not None:
    distance_matrix_km = dist_km_osrm
    duration_matrix_min = dur_min_osrm
    source = "OSRM (routes réelles)"
    print("   ✅ Matrice OSRM reçue")


distance_matrix_int  = (distance_matrix_km  * 1000).astype(int).tolist()  # mètres
duration_matrix_int  = (duration_matrix_min * 60).astype(int).tolist()    # secondes

labels = [p.get("label", p.get("client", f"P{i}")) for i, p in enumerate(tous_points)]
df_dist = pd.DataFrame(distance_matrix_km.round(1), index=labels, columns=labels)
df_dur  = pd.DataFrame(duration_matrix_min.round(0).astype(int), index=labels, columns=labels)

print(f"\n   Source : {source}")
print("\n📏 Matrice des distances (km) :")
print(df_dist.to_string())
print("\n⏱️  Matrice des durées (min) :")
print(df_dur.to_string())

from ortools.constraint_solver import routing_enums_pb2, pywrapcp

def resoudre_tsp(matrix, label="distance"):
    """
    Résout le TSP avec OR-Tools.
    matrix : matrice NxN d'entiers (distances en mètres OU durées en secondes)
    Retourne (route_indices, cout_total)
    """
    n = len(matrix)
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)  # n noeuds, 1 véhicule, dépôt=0
    routing = pywrapcp.RoutingModel(manager)

    def callback(from_idx, to_idx):
        return matrix[manager.IndexToNode(from_idx)][manager.IndexToNode(to_idx)]

    cb_idx = routing.RegisterTransitCallback(callback)
    routing.SetArcCostEvaluatorOfAllVehicles(cb_idx)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    params.time_limit.seconds = 15

    solution = routing.SolveWithParameters(params)
    if not solution:
        return None, None

    route = []
    idx = routing.Start(0)
    while not routing.IsEnd(idx):
        route.append(manager.IndexToNode(idx))
        idx = solution.Value(routing.NextVar(idx))
    route.append(0)  # retour dépôt

    return route, solution.ObjectiveValue()


# ── Optimisation sur les DURÉES (secondes) — critère temps ──
print("🔧 Optimisation TSP sur durées OSRM (minimiser le temps)...")
route_optimale, cout_sec = resoudre_tsp(duration_matrix_int, "durée")

if route_optimale is None:
    raise RuntimeError("❌ OR-Tools n'a pas trouvé de solution.")

# ── Calcul des métriques de la tournée ──
dist_totale_km  = sum(distance_matrix_km[route_optimale[i]][route_optimale[i+1]]
                      for i in range(len(route_optimale)-1))
dur_trajet_min  = sum(duration_matrix_min[route_optimale[i]][route_optimale[i+1]]
                      for i in range(len(route_optimale)-1))
nb_arrets       = len(route_optimale) - 2  # exclure dépôt départ et retour
dur_livr_min    = nb_arrets * TEMPS_LIVRAISON_MIN
dur_totale_min  = dur_trajet_min + dur_livr_min

print(f"   ✅ Solution trouvée !")
print(f"   Nombre d'arrêts   : {nb_arrets}")
print(f"   Distance totale   : {dist_totale_km:.1f} km")
print(f"   Durée conduite    : {dur_trajet_min:.0f} min  ({dur_trajet_min/60:.1f}h)")
print(f"   Durée livraisons  : {dur_livr_min} min  ({nb_arrets} × {TEMPS_LIVRAISON_MIN} min)")
print(f"   DURÉE TOTALE EST. : {dur_totale_min:.0f} min  ({dur_totale_min/60:.1f}h)")
print()
print("   Ordre optimal :")
ordre_str = " → ".join(labels[i] for i in route_optimale)
print(f"   {ordre_str}")

heure = datetime.datetime.strptime(HEURE_DEPART, "%H:%M")

print("=" * 70)
print("  FEUILLE DE ROUTE — TOURNÉE OPTIMISÉE (OSRM)")
print(f"  Générée le {datetime.date.today().strftime('%d/%m/%Y')}  |  Départ : {HEURE_DEPART}")
print("=" * 70)

rows = []

for step, idx in enumerate(route_optimale):
    point = tous_points[idx]

    if step == 0:
        role = "DÉPART"
        dist_prec = 0.0
        dur_prec  = 0.0
    elif step == len(route_optimale) - 1:
        role = "RETOUR"
        prev = route_optimale[step-1]
        dist_prec = distance_matrix_km[prev][idx]
        dur_prec  = duration_matrix_min[prev][idx]
    else:
        role = f"Arrêt {step:02d}"
        prev = route_optimale[step-1]
        dist_prec = distance_matrix_km[prev][idx]
        dur_prec  = duration_matrix_min[prev][idx]

    # Avancer l'heure du trajet
    if step > 0:
        heure += datetime.timedelta(minutes=dur_prec)

    heure_str = heure.strftime("%H:%M")
    nom     = point.get("client",  point.get("label", "Dépôt"))
    adresse = point.get("adresse", "")
    facture = point.get("facture", "—")

    print(f"\n  {role:<12} {heure_str}")
    if nom != "Entrepôt principal":
        print(f"  {'Client':<12} {nom}")
    if facture != "—":
        print(f"  {'Facture':<12} {facture}")
    print(f"  {'Adresse':<12} {adresse}")
    if dist_prec > 0:
        print(f"  {'Trajet':<12} {dist_prec:.1f} km  |  {dur_prec:.0f} min (OSRM)")
    print(f"  {'GPS':<12} {point['lat']:.5f}, {point['lon']:.5f}")

    # Ajouter temps de livraison sur place
    if step > 0 and step < len(route_optimale) - 1:
        heure += datetime.timedelta(minutes=TEMPS_LIVRAISON_MIN)

    rows.append({
        "Ordre":                          step,
        "Rôle":                           role,
        "Heure estimée":                  heure_str,
        "Client":                         nom,
        "Facture":                        facture,
        "Adresse":                        adresse,
        "Distance depuis précédent (km)": round(dist_prec, 2),
        "Durée trajet (min)": round(dur_prec, 1),
        "Latitude":                       point["lat"],
        "Longitude":                      point["lon"],
    })

print()
print("=" * 70)
print(f"  TOTAL  {dist_totale_km:.1f} km  |  {dur_totale_min:.0f} min de conduite+livraison ({dur_totale_min/60:.1f}h)")
print("=" * 70)

df_route = pd.DataFrame(rows)
print("\nTableau récapitulatif :")
df_route

!pip install PolyLine

import polyline as pl_lib   #or folium

# ── Installer polyline si besoin ──
try:
    import polyline as pl_lib
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "polyline", "-q"])
    import polyline as pl_lib


def osrm_route_geometry(point_a, point_b, base_url=OSRM_BASE_URL):
    """
    Récupère la géométrie exacte du trajet routier entre deux points via OSRM Route API.
    Retourne une liste de [lat, lon] pour tracer sur la carte, ou None si erreur.
    """
    coords = f"{point_a['lon']},{point_a['lat']};{point_b['lon']},{point_b['lat']}"
    url = f"{base_url}/route/v1/driving/{coords}?overview=full&geometries=polyline"
    try:
        resp = requests.get(url, timeout=15)
        data = resp.json()
        if data.get("code") == "Ok" and data.get("routes"):
            encoded = data["routes"][0]["geometry"]
            # Décoder le polyline encodé Google → liste de (lat, lon)
            return pl_lib.decode(encoded)
    except Exception:
        pass
    return None


# ── Construire la carte ──
centre_lat = sum(p["lat"] for p in tous_points) / n
centre_lon = sum(p["lon"] for p in tous_points) / n

m = folium.Map(location=[centre_lat, centre_lon], zoom_start=8,
               tiles="CartoDB dark_matter")

# ── Tracer chaque segment avec la géométrie OSRM ──
print("🗺️  Récupération des géométries de route (OSRM)...")
couleurs_segments = ["#00d4a0", "#00b8e6", "#a0e060", "#f0a030",
                     "#e060a0", "#8060f0", "#60d0f0"]

for seg_idx in range(len(route_optimale) - 1):
    i = route_optimale[seg_idx]
    j = route_optimale[seg_idx + 1]
    pa, pb = tous_points[i], tous_points[j]

    geom = osrm_route_geometry(pa, pb)
    couleur = couleurs_segments[seg_idx % len(couleurs_segments)]

    if geom:
        folium.PolyLine(
            geom, color=couleur, weight=4, opacity=0.85,
            tooltip=f"Segment {seg_idx+1} → {seg_idx+2}  |  "
                    f"{distance_matrix_km[i][j]:.1f} km  "
                    f"{duration_matrix_min[i][j]:.0f} min"
        ).add_to(m)
        print(f"   Segment {seg_idx+1:02d} → {seg_idx+2:02d}  ✅  route réelle tracée")
    else:
        folium.PolyLine(
            [[pa["lat"], pa["lon"]], [pb["lat"], pb["lon"]]],
            color=couleur, weight=3, opacity=0.6, dash_array="6 4"
        ).add_to(m)
        print(f"   Segment {seg_idx+1:02d} → {seg_idx+2:02d}  ⚠️  ligne droite (OSRM indisponible)")
    time.sleep(0.3)


folium.Marker(
    location=[DEPOT["lat"], DEPOT["lon"]],
    popup=folium.Popup(f"<b>🏭 DÉPÔT</b><br>{DEPOT['adresse']}", max_width=260),
    tooltip="Dépôt (départ & retour)",
    icon=folium.Icon(color="green", icon="home", prefix="fa")
).add_to(m)


for step, idx in enumerate(route_optimale[1:-1], start=1):
    point = tous_points[idx]
    prev  = route_optimale[step-1]
    dist  = distance_matrix_km[prev][idx]
    dur   = duration_matrix_min[prev][idx]
    heure = rows[step]["Heure estimée"] # heure estimée calculée précédemment
    nom = rows[step]["Client"]
    client = point.get("client", "")
    facture = point.get("facture", "")
    adresse = point.get("adresse", "")

    popup_html = f"""
    <div style='font-family:sans-serif;min-width:220px'>
      <b style='font-size:14px'>Arrêt {step}</b><br>
      <span style='color:#444;font-weight:600'>Client : {nom}</span><br>
      <span style='color:#888;font-size:11px'>Facture : {facture}</span><br>
      <span style='color:#0088cc;font-size:12px'>Heure estimée : {heure}</span>
      <hr style='margin:6px 0;border-color:#ddd'>
      {adresse}<br>
      <span style='color:#0088cc'>📏 +{dist:.1f} km  ⏱ +{dur:.0f} min (OSRM)</span>
    </div>"""

    folium.Marker(
        location=[point["lat"], point["lon"]],
        popup=folium.Popup(popup_html, max_width=270),
        tooltip=f"Arrêt {step} — {nom}",
        icon=folium.DivIcon(
            html=f"""<div style='
              width:30px;height:30px;border-radius:50%;
              background:#0098f0;color:white;
              display:flex;align-items:center;justify-content:center;
              font-weight:700;font-size:12px;
              border:2.5px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.5);
              font-family:monospace;'>{step}</div>""",
            icon_size=(30, 30), icon_anchor=(15, 15)
        )
    ).add_to(m)

# ── Légende ──
legend_html = f"""
<div style='
  position:fixed;bottom:28px;left:28px;z-index:1000;
  background:rgba(15,17,23,0.93);color:#e8eaf0;
  padding:14px 18px;border-radius:10px;
  font-family:monospace;font-size:12px;
  border:1px solid rgba(255,255,255,0.1);
  line-height:1.8;
'>
  <b style='color:#00d4a0;font-size:13px'>TOURNÉE OPTIMISÉE</b><br>
  <span style='color:#555'>{'─'*22}</span><br>
  Source &nbsp;&nbsp;: <b>OSRM routes réelles</b><br>
  Arrêts &nbsp;&nbsp;: <b>{nb_arrets}</b><br>
  Distance : <b>{dist_totale_km:.1f} km</b><br>
  Durée &nbsp;&nbsp;&nbsp;: <b>{dur_totale_min:.0f} min ({dur_totale_min/60:.1f}h)</b>
</div>
"""
m.get_root().html.add_child(folium.Element(legend_html))

print("\n✅ Carte générée")
display(m)

#!pip install folium

# import folium
# from IPython.display import display

# # ── Heures dépôt ──
# heure_depart = HEURE_DEPART
# heure_arrivee_depot = df_route.iloc[-1]["Heure estimée"]

# # ── Centre de la carte ──
# centre_lat = sum(p["lat"] for p in tous_points) / len(tous_points)
# centre_lon = sum(p["lon"] for p in tous_points) / len(tous_points)

# m = folium.Map(
#     location=[centre_lat, centre_lon],
#     zoom_start=8,
#     tiles="CartoDB dark_matter"
# )

# # ── Tracer la route optimale ──
# coords_route = [[tous_points[i]["lat"], tous_points[i]["lon"]] for i in route_optimale]

# folium.PolyLine(
#     coords_route,
#     color="#00d4a0",
#     weight=3,
#     opacity=0.8,
#     dash_array="8 4",
#     tooltip="Tournée optimisée"
# ).add_to(m)

# # ── Marqueur dépôt ──
# folium.Marker(
#     location=[DEPOT["lat"], DEPOT["lon"]],
#     popup=folium.Popup(f"""
#     <div style='font-family:sans-serif;min-width:200px'>
#       <b>🏭 DÉPÔT</b>
#       <hr>
#       <b>Adresse :</b><br>
#       {DEPOT['adresse']}<br><br>
#       <b>Heure départ :</b> {heure_depart}<br>
#       <b>Heure retour :</b> {heure_arrivee_depot}
#     </div>
#     """, max_width=260),
#     tooltip=f"Dépôt | Départ {heure_depart} | Retour {heure_arrivee_depot}",
#     icon=folium.Icon(color="green", icon="home", prefix="fa")
# ).add_to(m)

# # ── Marqueurs des arrêts ──
# for step, idx in enumerate(route_optimale[1:-1], start=1):

#     point = tous_points[idx]
#     prev_idx = route_optimale[step - 1]
#     dist = distance_matrix_km[prev_idx][idx]

#     heure_arrivee = df_route[df_route["Ordre"] == step]["Heure estimée"].iloc[0]
#     entreprise = df_route[df_route["Ordre"] == step]["Client"].iloc[0]

#     popup_html = f"""
#     <div style='font-family:sans-serif;min-width:200px'>
#       <b>Arrêt {step}</b><br>

#       <b>Entreprise :</b> {entreprise}<br>
#       <b>Heure estimée :</b> {heure_arrivee}<br>

#       <hr>

#       <b>Adresse :</b><br>
#       {point['adresse']}<br>

#       <span style='color:#00a0d0'>+{dist:.1f} km depuis précédent</span>
#     </div>
#     """

#     folium.Marker(
#         location=[point["lat"], point["lon"]],
#         popup=folium.Popup(popup_html, max_width=260),
#         tooltip=f"{step} — {entreprise} ({heure_arrivee})",

#         icon=folium.DivIcon(
#             html=f"""
#             <div style="
#                 width:30px;
#                 height:30px;
#                 border-radius:50%;
#                 background:#0098f0;
#                 color:white;
#                 display:flex;
#                 align-items:center;
#                 justify-content:center;
#                 font-weight:bold;
#                 border:2px solid white;
#                 box-shadow:0 2px 6px rgba(0,0,0,0.4);
#             ">
#                 {step}
#             </div>
#             """,
#             icon_size=(30,30),
#             icon_anchor=(15,15)
#         )
#     ).add_to(m)

# # ── Légende ──
# legend_html = f"""
# <div style='
#   position:fixed; bottom:30px; left:30px; z-index:1000;
#   background:rgba(20,24,36,0.92); color:#e8eaf0;
#   padding:14px 18px; border-radius:10px;
#   font-family:monospace; font-size:13px;
#   border:1px solid rgba(255,255,255,0.1);
# '>
#   <b style='color:#00d4a0'>TOURNÉE OPTIMISÉE</b><br>
#   ─────────────────<br>
#   Arrêts : <b>{len(route_optimale)-2}</b><br>
#   Distance : <b>{distance_totale:.1f} km</b><br>
#   Durée : <b>{duree_totale:.0f} min</b><br>
#   Départ : <b>{heure_depart}</b><br>
#   Retour : <b>{heure_arrivee_depot}</b>
# </div>
# """

# m.get_root().html.add_child(folium.Element(legend_html))

# display(m)