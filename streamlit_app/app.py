import os
import streamlit as st
import pandas as pd

# Try to load .env if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import requests

# Mock flights data (converted from the project's TypeScript mockFlights)
mock_flights = [
    {"flightNumber": "DY602", "airline": "Norwegian Air Shuttle", "airlineCode": "DY", "departure": {"code": "OSL", "city": "Oslo", "time": "2026-06-14T08:00:00", "timezone": "Europe/Oslo"}, "arrival": {"code": "BGO", "city": "Bergen", "time": "2026-06-14T08:50:00", "timezone": "Europe/Oslo"}, "duration": "50m", "status": "Scheduled", "aircraft": "Boeing 737-800", "gate": "A12", "terminal": "Main"},
    {"flightNumber": "SK1461", "airline": "Scandinavian Airlines (SAS)", "airlineCode": "SK", "departure": {"code": "OSL", "city": "Oslo", "time": "2026-06-14T10:15:00", "timezone": "Europe/Oslo"}, "arrival": {"code": "CPH", "city": "Copenhagen", "time": "2026-06-14T11:25:00", "timezone": "Europe/Copenhagen"}, "duration": "1h 10m", "status": "Scheduled", "aircraft": "Airbus A320neo", "gate": "E04", "terminal": "3"},
    {"flightNumber": "WF612", "airline": "Widerøe", "airlineCode": "WF", "departure": {"code": "BGO", "city": "Bergen", "time": "2026-06-14T12:00:00", "timezone": "Europe/Oslo"}, "arrival": {"code": "TOS", "city": "Tromsø", "time": "2026-06-14T14:05:00", "timezone": "Europe/Oslo"}, "duration": "2h 05m", "status": "En Route", "aircraft": "De Havilland Dash 8-400", "gate": "C2", "terminal": "Main"},
    {"flightNumber": "SK4702", "airline": "Scandinavian Airlines (SAS)", "airlineCode": "SK", "departure": {"code": "OSL", "city": "Oslo", "time": "2026-06-14T15:30:00", "timezone": "Europe/Oslo"}, "arrival": {"code": "NCE", "city": "Nice", "time": "2026-06-14T18:40:00", "timezone": "Europe/Paris"}, "duration": "3h 10m", "status": "Delayed", "aircraft": "Airbus A320neo", "gate": "F15", "terminal": "2"},
    {"flightNumber": "DY1340", "airline": "Norwegian Air Shuttle", "airlineCode": "DY", "departure": {"code": "OSL", "city": "Oslo", "time": "2026-06-14T13:45:00", "timezone": "Europe/Oslo"}, "arrival": {"code": "PRG", "city": "Prague", "time": "2026-06-14T15:50:00", "timezone": "Europe/Prague"}, "duration": "2h 05m", "status": "Scheduled", "aircraft": "Boeing 737 MAX 8", "gate": "D08", "terminal": "1"},
    {"flightNumber": "KL1142", "airline": "KLM Royal Dutch Airlines", "airlineCode": "KL", "departure": {"code": "TRD", "city": "Trondheim", "time": "2026-06-14T06:00:00", "timezone": "Europe/Oslo"}, "arrival": {"code": "AMS", "city": "Amsterdam", "time": "2026-06-14T08:15:00", "timezone": "Europe/Amsterdam"}, "duration": "2h 15m", "status": "Landed", "aircraft": "Embraer 190", "gate": "B03", "terminal": "Main"},
]


def flatten_flights(flights):
    rows = []
    for f in flights:
        dep = f.get("departure", {})
        arr = f.get("arrival", {})
        row = {
            "flightNumber": f.get("flightNumber"),
            "airline": f.get("airline"),
            "airlineCode": f.get("airlineCode"),
            "departure_code": dep.get("code"),
            "departure_city": dep.get("city"),
            "departure_time": dep.get("time"),
            "arrival_code": arr.get("code"),
            "arrival_city": arr.get("city"),
            "arrival_time": arr.get("time"),
            "duration": f.get("duration"),
            "status": f.get("status"),
            "aircraft": f.get("aircraft"),
            "gate": f.get("gate"),
            "terminal": f.get("terminal"),
        }
        rows.append(row)
    return rows


st.set_page_config(page_title="Norway Flight Board", layout="wide")
st.title("🇳🇴 Norway Flight Board")

# Determine AVIATION API key
AVIATION_API_KEY = os.environ.get('AVIATION_API_KEY')
if not AVIATION_API_KEY:
    st.sidebar.warning('AVIATION_API_KEY not found in environment; falling back to mock data.')

# Helper to call Aviationstack
def fetch_aviationstack(query):
    """Simple fetch wrapper. Query may be flight number, single IATA or origin-destination like KRS-OSL."""
    if not AVIATION_API_KEY:
        return None
    q = query.strip()
    
    # Simple mapping for city names
    CITY_TO_IATA = {
        "KRISTIANSAND": "KRS", "OSLO": "OSL", "BERGEN": "BGO", 
        "TRONDHEIM": "TRD", "TROMSO": "TOS", "STAVANGER": "SVG", 
        "SANDEFJORD": "TRF", "BODO": "BOO", "ALTA": "ALF", "ALESUND": "AES"
    }

    # origin-destination
    parts = [p.strip().upper() for p in q.replace('\u2192','-').replace(' to ', '-').split('-') if p.strip()]
    params = {'access_key': AVIATION_API_KEY, 'limit': 50}
    
    if len(parts) == 2:
        a, b = parts
        params['dep_iata'] = a if len(a) == 3 else CITY_TO_IATA.get(a)
        params['arr_iata'] = b if len(b) == 3 else CITY_TO_IATA.get(b)
        if not params.get('dep_iata') or not params.get('arr_iata'):
            return None
    else:
        norm = q.replace(' ', '').upper()
        if norm.isalpha() and len(norm) == 3:
            params['dep_iata'] = norm
        elif any(ch.isdigit() for ch in norm):
            params['flight_iata'] = norm
        else:
            return None

    try:
        resp = requests.get('http://api.aviationstack.com/v1/flights', params=params, timeout=10)
        if resp.status_code != 200:
            st.sidebar.error(f'API error: {resp.status_code}')
            return None
        data = resp.json().get('data', [])
        return data
    except Exception as e:
        st.sidebar.error(f'Failed to call Aviationstack: {e}')
        return None


st.write("Real-time flight schedules for Norway. Connects to Aviationstack API.")

use_real = st.sidebar.checkbox('Use real API (Aviationstack)', value=bool(AVIATION_API_KEY))

# Data source selection
source_flights = mock_flights

# If using real API and search/filter provided, attempt to fetch
query_input = st.sidebar.text_input("Search flight number, city or route (e.g. OSL-BGO)")
if use_real and query_input:
    with st.spinner('Fetching real-time data...'):
        api_data = fetch_aviationstack(query_input)
        if api_data:
            # Map Aviationstack fields to our internal structure
            mapped = []
            for av in api_data:
                dep = av.get('departure', {})
                arr = av.get('arrival', {})
                flight_info = av.get('flight', {})
                
                # Simple duration calculation
                duration = "N/A"
                try:
                    if dep.get('scheduled') and arr.get('scheduled'):
                        from datetime import datetime
                        d1 = datetime.fromisoformat(dep['scheduled'].replace('Z', '+00:00'))
                        d2 = datetime.fromisoformat(arr['scheduled'].replace('Z', '+00:00'))
                        diff = d2 - d1
                        minutes = int(diff.total_seconds() / 60)
                        if minutes > 0:
                            h = minutes // 60
                            m = minutes % 60
                            duration = f"{h}h {m}m" if h > 0 else f"{m}m"
                except:
                    pass

                mapped.append({
                    'flightNumber': flight_info.get('iata') or flight_info.get('number') or 'N/A',
                    'airline': av.get('airline', {}).get('name', 'Unknown'),
                    'airlineCode': av.get('airline', {}).get('iata', 'N/A'),
                    'departure': {
                        'code': dep.get('iata','N/A'), 
                        'city': dep.get('airport','').replace(' Airport', ''),
                        'time': dep.get('scheduled', ''),
                        'timezone': dep.get('timezone', 'UTC')
                    },
                    'arrival': {
                        'code': arr.get('iata','N/A'), 
                        'city': arr.get('airport','').replace(' Airport', ''),
                        'time': arr.get('scheduled', ''),
                        'timezone': arr.get('timezone', 'UTC')
                    },
                    'duration': duration,
                    'status': av.get('flight_status','Scheduled').capitalize(),
                    'aircraft': av.get('aircraft', {}).get('registration','Boeing 737'),
                    'gate': dep.get('gate'),
                    'terminal': dep.get('terminal')
                })
            if mapped:
                source_flights = mapped
            else:
                st.sidebar.info('No flights found for this query.')
        elif query_input:
            st.sidebar.info('No data returned from API; showing mock results.')

# Build dataframe
df = pd.DataFrame(flatten_flights(source_flights))

# Sidebar filters
st.sidebar.header("Filters")
all_departures = ["All"] + sorted([x for x in df["departure_city"].unique().tolist() if x])
all_arrivals = ["All"] + sorted([x for x in df["arrival_city"].unique().tolist() if x])
all_status = ["All"] + sorted([x for x in df["status"].unique().tolist() if x])

dep = st.sidebar.selectbox("Departure city", all_departures, index=0)
arr = st.sidebar.selectbox("Arrival city", all_arrivals, index=0)
stat = st.sidebar.selectbox("Status", all_status, index=0)
search = st.sidebar.text_input("Filter table (airline/flight)")

filtered = df.copy()
if dep != "All":
    filtered = filtered[filtered["departure_city"] == dep]
if arr != "All":
    filtered = filtered[filtered["arrival_city"] == arr]
if stat != "All":
    filtered = filtered[filtered["status"] == stat]
if search:
    s = search.lower()
    filtered = filtered[
        filtered["flightNumber"].str.lower().str.contains(s, na=False)
        | filtered["airline"].str.lower().str.contains(s, na=False)
    ]

st.sidebar.markdown(f"**{len(filtered)}** flights matching filters")

# Main table
st.dataframe(filtered.reset_index(drop=True), use_container_width=True)

# Detailed view for selected flight
sel = st.selectbox("Select flight for details", ["None"] + filtered["flightNumber"].tolist())
if sel and sel != "None":
    flight = next((f for f in source_flights if f.get("flightNumber") == sel), None)
    if flight:
        st.header(f"{flight.get('flightNumber')} — {flight.get('airline')}")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.subheader("🛫 Departure")
            d = flight['departure']
            st.write(f"**City:** {d.get('city')}")
            st.write(f"**Airport:** {d.get('code')}")
            st.write(f"**Time:** {d.get('time', '-') }")
            st.write(f"**Gate:** {flight.get('gate') or '-'}")
            st.write(f"**Terminal:** {flight.get('terminal') or '-'}")
        with col2:
            st.subheader("🛬 Arrival")
            a = flight['arrival']
            st.write(f"**City:** {a.get('city')}")
            st.write(f"**Airport:** {a.get('code')}")
            st.write(f"**Time:** {a.get('time', '-') }")
            st.write(f"**Duration:** {flight.get('duration')}")
        with col3:
            st.subheader("ℹ️ Flight Info")
            st.write(f"**Status:** {flight.get('status')}")
            st.write(f"**Aircraft:** {flight.get('aircraft')}")
            st.write(f"**Airline Code:** {flight.get('airlineCode')}")


st.markdown("---")
st.write("Deploy to Streamlit Cloud: create a new app, pick this repo, and set the app path to streamlit_app/app.py.")
