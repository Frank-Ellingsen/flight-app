import { NextRequest, NextResponse } from "next/server";
import { Flight, mockFlights } from "@/data/mockFlights";

export const dynamic = "force-dynamic";

// Simple list of known major airports in Norway for validation
const NORWAY_AIRPORTS = ["OSL", "BGO", "TRD", "SVG", "TOS", "TRF", "BOO", "SVJ", "AES", "KRS", "HAU"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get("query") || searchParams.get("flightNumber") || "").trim();
  
  if (!query) {
    return NextResponse.json({ flights: [] });
  }

  const normalizedQuery = query.replace(/\s+/g, "").toUpperCase();
  const apiKey = process.env.AVIATION_API_KEY;

  // Graceful Fallback check: If API key is missing or is a placeholder, use mock database
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.length < 10) {
    console.log("Aviationstack API Key missing or invalid. Falling back to mock database.");
    return handleMockSearch(normalizedQuery);
  }

  try {
    // Construct the Aviationstack query
    // Free plan restrictions:
    // 1. Must use http:// instead of https://
    // 2. We filter by flight_iata (if it looks like a flight code) or dep_iata/arr_iata
    let url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}`;

    // Regex to detect flight number (e.g. SK1461, DY602, WF 612)
    const isFlightNumber = /^[A-Z0-9]{2,3}\d{1,4}$/.test(normalizedQuery);
    
    // Regex to detect 3-letter airport code (e.g. OSL, BGO, LHR)
    const isAirportCode = /^[A-Z]{3}$/.test(normalizedQuery);

    if (isFlightNumber) {
      url += `&flight_iata=${normalizedQuery}`;
    } else if (isAirportCode) {
      // Free tier doesn't allow OR querying for departure and arrival in a single param easily,
      // so we query for all flights matching the airport and filter, or query with dep_iata.
      url += `&dep_iata=${normalizedQuery}`;
    } else {
      // If it's a general query (like city name), Aviationstack free tier doesn't support full-text search.
      // We will perform a fallback search on the mock database to give users a working experience!
      console.log(`General text search "${query}" not supported by Aviationstack free tier. Using mock DB.`);
      return handleMockSearch(normalizedQuery);
    }

    console.log(`Calling Aviationstack API for query: ${normalizedQuery}`);
    
    const response = await fetch(url, {
      next: { revalidate: 0 } // Disable fetch caching for real-time flight lookups
    });

    if (!response.ok) {
      throw new Error(`Aviationstack API returned status ${response.status}`);
    }

    const apiData = await response.json();

    if (apiData.error) {
      console.error("Aviationstack API error code:", apiData.error.code, apiData.error.message);
      throw new Error(`API Error: ${apiData.error.message}`);
    }

    const rawFlights = apiData.data || [];
    
    // Map and filter flights (Only return flights to/from Norway)
    const mappedFlights: Flight[] = rawFlights
      .map(mapAviationstackToFlight)
      .filter((flight: Flight) => {
        // Flight must be departing from OR arriving in Norway
        const depNorway = 
          flight.departure.timezone?.includes("Oslo") || 
          NORWAY_AIRPORTS.includes(flight.departure.code);
        const arrNorway = 
          flight.arrival.timezone?.includes("Oslo") || 
          NORWAY_AIRPORTS.includes(flight.arrival.code);

        return depNorway || arrNorway;
      });

    // If the query was an airport code, we also want to fetch arrival flights to merge them!
    // We only do this if we haven't hit limits. In the free tier, doing parallel calls is okay.
    let finalFlights = mappedFlights;
    if (isAirportCode && apiData.pagination && apiData.pagination.total > 0) {
      try {
        const arrUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&arr_iata=${normalizedQuery}`;
        const arrResponse = await fetch(arrUrl);
        if (arrResponse.ok) {
          const arrApiData = await arrResponse.json();
          if (arrApiData.data) {
            const arrMapped: Flight[] = arrApiData.data
              .map(mapAviationstackToFlight)
              .filter((flight: Flight) => {
                const depNorway = flight.departure.timezone?.includes("Oslo") || NORWAY_AIRPORTS.includes(flight.departure.code);
                const arrNorway = flight.arrival.timezone?.includes("Oslo") || NORWAY_AIRPORTS.includes(flight.arrival.code);
                return depNorway || arrNorway;
              });
            
            // Merge lists and remove duplicate flight numbers
            const flightMap = new Map();
            [...finalFlights, ...arrMapped].forEach((f) => {
              flightMap.set(f.flightNumber, f);
            });
            finalFlights = Array.from(flightMap.values());
          }
        }
      } catch (err) {
        console.error("Failed to fetch secondary arrivals list:", err);
      }
    }

    return NextResponse.json({ flights: finalFlights });

  } catch (error: any) {
    console.error("Aviationstack API integration failed. Falling back to mock data.", error.message);
    // Graceful fallback to mock data on API failures
    return handleMockSearch(normalizedQuery);
  }
}

// Fallback search handler using the mock database
function handleMockSearch(normalizedQuery: string) {
  const results = mockFlights.filter((flight) => {
    const flightNumClean = flight.flightNumber.replace(/\s+/g, "").toUpperCase();
    const airlineClean = flight.airline.toUpperCase();
    const depCityClean = flight.departure.city.toUpperCase();
    const arrCityClean = flight.arrival.city.toUpperCase();
    const depAirportClean = flight.departure.code.toUpperCase();
    const arrAirportClean = flight.arrival.code.toUpperCase();

    return (
      flightNumClean.includes(normalizedQuery) ||
      airlineClean.includes(normalizedQuery) ||
      depCityClean.includes(normalizedQuery) ||
      arrCityClean.includes(normalizedQuery) ||
      depAirportClean.includes(normalizedQuery) ||
      arrAirportClean.includes(normalizedQuery)
    );
  });
  return NextResponse.json({ flights: results, isMockData: true });
}

// Helper: Map Aviationstack API response to our custom Flight interface
function mapAviationstackToFlight(avFlight: any): Flight {
  const depTime = avFlight.departure?.scheduled;
  const arrTime = avFlight.arrival?.scheduled;
  
  // Calculate flight duration
  let duration = "N/A";
  if (depTime && arrTime) {
    const diffMs = new Date(arrTime).getTime() - new Date(depTime).getTime();
    if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    }
  }

  // Parse timezone offset (e.g. from "2026-06-14T08:00:00+02:00" -> "UTC+2")
  const getOffset = (scheduledTime: string) => {
    if (!scheduledTime) return "UTC";
    const match = scheduledTime.match(/([+-]\d{2}:\d{2})$/);
    return match ? `UTC${match[1]}` : "UTC";
  };

  // Map status (scheduled, active, landed, cancelled, incident, etc.)
  let status: 'Scheduled' | 'Delayed' | 'En Route' | 'Landed' = 'Scheduled';
  const rawStatus = avFlight.flight_status;
  if (rawStatus === 'active') {
    status = 'En Route';
  } else if (rawStatus === 'landed') {
    status = 'Landed';
  } else if (rawStatus === 'cancelled' || rawStatus === 'incident') {
    status = 'Delayed';
  } else if (avFlight.departure?.delay && avFlight.departure.delay > 15) {
    status = 'Delayed';
  }

  // Clean city names from airport names (e.g., "Oslo Airport Gardermoen" -> "Oslo")
  const getCity = (airportName: string, iata: string) => {
    if (!airportName) return iata || "Unknown";
    const cleanAirport = airportName.replace(/ Airport| International/gi, "");
    const parts = cleanAirport.split(/,| -/);
    return parts[0].trim();
  };

  // Format flight number (e.g., Airline code + Flight number)
  const flightNumber = avFlight.flight?.iata || avFlight.flight?.icao || `FL-${avFlight.flight?.number || "N/A"}`;

  return {
    flightNumber,
    airline: avFlight.airline?.name || "Unknown Airline",
    airlineCode: avFlight.airline?.iata || "N/A",
    departure: {
      code: avFlight.departure?.iata || "N/A",
      name: avFlight.departure?.airport || "Unknown Airport",
      city: getCity(avFlight.departure?.airport, avFlight.departure?.iata),
      country: avFlight.departure?.timezone?.includes("Oslo") ? "Norway" : "International",
      time: depTime ? depTime.substring(0, 19) : "",
      timezone: avFlight.departure?.timezone || "UTC",
      offset: getOffset(depTime)
    },
    arrival: {
      code: avFlight.arrival?.iata || "N/A",
      name: avFlight.arrival?.airport || "Unknown Airport",
      city: getCity(avFlight.arrival?.airport, avFlight.arrival?.iata),
      country: avFlight.arrival?.timezone?.includes("Oslo") ? "Norway" : "International",
      time: arrTime ? arrTime.substring(0, 19) : "",
      timezone: avFlight.arrival?.timezone || "UTC",
      offset: getOffset(arrTime)
    },
    duration,
    status,
    aircraft: avFlight.aircraft?.registration || "Boeing 737",
    gate: avFlight.departure?.gate || undefined,
    terminal: avFlight.departure?.terminal || undefined
  };
}
