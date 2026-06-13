import streamlit as st
import pandas as pd

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
        row = {
            "flightNumber": f.get("flightNumber"),
            "airline": f.get("airline"),
            "airlineCode": f.get("airlineCode"),
            "departure_code": f["departure"].get("code"),
            "departure_city": f["departure"].get("city"),
            "departure_time": f["departure"].get("time"),
            "arrival_code": f["arrival"].get("code"),
            "arrival_city": f["arrival"].get("city"),
            "arrival_time": f["arrival"].get("time"),
            "duration": f.get("duration"),
            "status": f.get("status"),
            "aircraft": f.get("aircraft"),
            "gate": f.get("gate"),
            "terminal": f.get("terminal"),
        }
        rows.append(row)
    return rows


st.set_page_config(page_title="Flight Viewer", layout="wide")
st.title("Flight Viewer (Streamlit)")
st.write("A simple viewer for the mock flight data included in this repo.")

# Data
df = pd.DataFrame(flatten_flights(mock_flights))

# Sidebar filters
st.sidebar.header("Filters")
all_departures = ["All"] + sorted(df["departure_city"].unique().tolist())
all_arrivals = ["All"] + sorted(df["arrival_city"].unique().tolist())
all_status = ["All"] + sorted(df["status"].unique().tolist())

dep = st.sidebar.selectbox("Departure city", all_departures, index=0)
arr = st.sidebar.selectbox("Arrival city", all_arrivals, index=0)
stat = st.sidebar.selectbox("Status", all_status, index=0)
search = st.sidebar.text_input("Search flight number or airline")

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
        filtered["flightNumber"].str.lower().str.contains(s)
        | filtered["airline"].str.lower().str.contains(s)
    ]

st.sidebar.markdown(f"**{len(filtered)}** flights matching")

# Main table
st.dataframe(filtered.reset_index(drop=True))

# Detailed view for selected flight
sel = st.selectbox("Select flight for details", ["None"] + filtered["flightNumber"].tolist())
if sel and sel != "None":
    flight = next((f for f in mock_flights if f["flightNumber"] == sel), None)
    if flight:
        st.header(f"{flight['flightNumber']} — {flight['airline']}")
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Departure")
            st.write(flight["departure"]["city"]) 
            st.write(f"{flight['departure']['city']} ({flight['departure']['code']})")
            st.write(f"Time: {flight['departure']['time']} ({flight['departure']['timezone']})")
            st.write(f"Gate: {flight.get('gate', '-')}")
            st.write(f"Terminal: {flight.get('terminal', '-')}")
        with col2:
            st.subheader("Arrival")
            st.write(flight["arrival"]["city"]) 
            st.write(f"{flight['arrival']['city']} ({flight['arrival']['code']})")
            st.write(f"Time: {flight['arrival']['time']} ({flight['arrival']['timezone']})")
            st.write(f"Duration: {flight.get('duration')}")
            st.write(f"Aircraft: {flight.get('aircraft')}")

st.markdown("---")
st.write("Deploy to Streamlit Cloud: create a new app, pick this repo, and set the app path to streamlit_app/app.py.")
