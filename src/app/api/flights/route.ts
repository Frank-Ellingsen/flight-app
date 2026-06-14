import { NextRequest, NextResponse } from "next/server";
import { Flight, mockFlights } from "@/data/mockFlights";

export const dynamic = "force-dynamic";

// Comprehensive list of known major and regional airports in Norway for validation
const NORWAY_AIRPORTS = [
  "OSL", "BGO", "TRD", "SVG", "TOS", "TRF", "BOO", "SVJ", "AES", "KRS", "HAU",
  "MOL", "KSU", "EVE", "SRP", "ALF", "LKL", "MEH", "HVG", "VDS", "VKK", "MQN",
  "SSJ", "BNN", "OSY", "ANX", "SKN", "HOV", "FDE", "SOG", "VDB", "RRS", "NOT",
  "NVK", "LKN", "RET", "VRY", "GLL", "BDU", "HFT", "BVG", "BJF", "VAW"
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = (searchParams.get("query") || searchParams.get("flightNumber") || "").trim();

  if (!rawQuery) {
    return NextResponse.json({ flights: [] });
  }

  const query = rawQuery;
  const normalizedQuery = query.replace(/\s+/g, "").toUpperCase();

  // Check for custom API key in headers first, then fall back to environment variable
  const apiKey = request.headers.get("x-api-key") || process.env.AVIATION_API_KEY;

  // Graceful Fallback check: If API key is missing or is a placeholder, use mock database
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.length < 10) {
    console.log("Aviationstack API Key missing or invalid. Falling back to mock database.");
    return handleMockSearch(normalizedQuery);
  }

  // Mapping of common Norwegian city names to IATA codes for origin-destination lookups  
  const CITY_TO_IATA: Record<string, string> = {
    "OSLO": "OSL",
    "KRISTIANSAND": "KRS",
    "KRISTIANSAND S": "KRS",
    "BERGEN": "BGO",
    "TRONDHEIM": "TRD",
    "TROMSO": "TOS",
    "TROMSØ": "TOS",
    "SAND EFJORD": "TRF",
    "SANDEFJORD": "TRF",
    "BODO": "BOO",
    "BODØ": "BOO",
    "SVOLVÆR": "SVJ",
    "SVOLVAER": "SVJ",
    "HAUGESUND": "HAU",
    "HAUGESUND KARMØY": "HAU",
    "STAVANGER": "SVG",
    "KRS": "KRS",
    "ALTA": "ALF",
    "AALESUND": "AES",
    "ÅLESUND": "AES",
    "MOLDE": "MOL",
    "KRISTIANSUND": "KSU"
  };

  try {
    // Detect origin-destination patterns like "Kristiansand-Oslo", "Kristiansand to Oslo", "KRS-OSL"    
    const odSplit = query.split(/[-–\/]| to |\u2192 /i).map((s) => s.trim()).filter(Boolean);

    let depCode: string | undefined;
    let arrCode: string | undefined;

    if (odSplit.length === 2) {
      const a = odSplit[0].toUpperCase();
      const b = odSplit[1].toUpperCase();

      // Try direct IATA match first
      if (/^[A-Z]{3}$/.test(a)) depCode = a;
      if (/^[A-Z]{3}$/.test(b)) arrCode = b;

      // Try city -> IATA map
      const cityA = a.replace(/\s+/g, "");
      const cityB = b.replace(/\s+/g, "");
      if (!depCode && CITY_TO_IATA[cityA]) depCode = CITY_TO_IATA[cityA];
      if (!arrCode && CITY_TO_IATA[cityB]) arrCode = CITY_TO_IATA[cityB];

      // Last-resort: search mock DB city names for mapping
      if (!depCode) {
        const found = mockFlights.find(f => f.departure.city.toUpperCase().includes(a) || f.arrival.city.toUpperCase().includes(a));
        if (found) depCode = found.departure.code;
      }
      if (!arrCode) {
        const found = mockFlights.find(f => f.departure.city.toUpperCase().includes(b) || f.arrival.city.toUpperCase().includes(b));
        if (found) arrCode = found.arrival.code;
      }
    }

    // Build API URL
    let url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}`;

    if (depCode && arrCode) {
      url += `&dep_iata=${depCode}&arr_iata=${arrCode}`;
    } else {
      const isFlightNumber = /^[A-Z0-9]{2,3}\d{1,4}$/.test(normalizedQuery);
      const isAirportCode = /^[A-Z]{3}$/.test(normalizedQuery);

      if (isFlightNumber) {
        url += `&flight_iata=${normalizedQuery}`;
      } else if (isAirportCode) {
        url += `&dep_iata=${normalizedQuery}`;
      } else if (depCode) {
        url += `&dep_iata=${depCode}`;
      } else if (arrCode) {
        url += `&arr_iata=${arrCode}`;
      } else {
        console.log(`General text search "${query}" not supported by Aviationstack free tier. Using mock DB.`);
        return handleMockSearch(normalizedQuery);
      }
    }

    console.log(`Calling Aviationstack API for query: ${query} -> ${url}`);

    const response = await fetch(url, {
      next: { revalidate: 0 }
    });

    if (!response.ok) throw new Error(`Aviationstack API returned status ${response.status}`);

    const apiData = await response.json();
    if (apiData.error) throw new Error(apiData.error.message || 'API Error');

    const rawFlights = apiData.data || [];
    const mappedFlights: Flight[] = rawFlights
      .map(mapAviationstackToFlight)
      .filter((flight: Flight) => {
        const depNorway = flight.departure.timezone?.includes("Oslo") || NORWAY_AIRPORTS.includes(flight.departure.code) || flight.departure.country === "Norway";
        const arrNorway = flight.arrival.timezone?.includes("Oslo") || NORWAY_AIRPORTS.includes(flight.arrival.code) || flight.arrival.country === "Norway";
        return depNorway || arrNorway;
      });

    let finalFlights = mappedFlights;

    // If we searched by airport code, also fetch arrivals to show a full board for that airport
    const isAirportCodeOnly = !depCode && !arrCode && /^[A-Z]{3}$/.test(normalizedQuery);
    if (isAirportCodeOnly) {
        const airportCode = normalizedQuery;
        try {
            const arrUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&arr_iata=${airportCode}`;
            const arrResponse = await fetch(arrUrl);
            if (arrResponse.ok) {
              const arrApiData = await arrResponse.json();
              if (arrApiData.data) {
                const arrMapped: Flight[] = arrApiData.data.map(mapAviationstackToFlight);
                const flightMap = new Map();
                [...finalFlights, ...arrMapped].forEach((f) => flightMap.set(f.flightNumber, f));
                finalFlights = Array.from(flightMap.values());
              }
            }
          } catch (err) {
            console.error('Failed to fetch arrivals for airport merge', err);
          }
    }

    // Handle single depCode resolved from city search
    if (depCode && !arrCode && finalFlights.length < 5) {
      try {
        const arrUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&arr_iata=${depCode}`;
        const arrResponse = await fetch(arrUrl);
        if (arrResponse.ok) {
          const arrApiData = await arrResponse.json();
          if (arrApiData.data) {
            const arrMapped: Flight[] = arrApiData.data.map(mapAviationstackToFlight);
            const flightMap = new Map();
            [...finalFlights, ...arrMapped].forEach((f) => flightMap.set(f.flightNumber, f));
            finalFlights = Array.from(flightMap.values());
          }
        }
      } catch (err) {
        console.error('Failed to fetch arrivals for depCode merge', err);
      }
    }

    if (depCode && arrCode && finalFlights.length === 0) {
      try {
        console.log(`No flights found for route ${depCode}-${arrCode}, trying ${arrCode}-${depCode}`);
        const swappedUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${arrCode}&arr_iata=${depCode}`;
        const swappedResp = await fetch(swappedUrl, { next: { revalidate: 0 } });
        if (swappedResp.ok) {
          const swappedData = await swappedResp.json();
          if (swappedData.data && swappedData.data.length > 0) {
            const swappedMapped: Flight[] = swappedData.data.map(mapAviationstackToFlight)
              .filter((flight: Flight) => {
                const depNorway = flight.departure.timezone?.includes("Oslo") || NORWAY_AIRPORTS.includes(flight.departure.code);
                const arrNorway = flight.arrival.timezone?.includes("Oslo") || NORWAY_AIRPORTS.includes(flight.arrival.code);
                return depNorway || arrNorway;
              });
            const flightMap = new Map();
            [...finalFlights, ...swappedMapped].forEach((f) => flightMap.set(f.flightNumber, f));
            finalFlights = Array.from(flightMap.values());
          }
        }
      } catch (err) {
        console.error('Failed to fetch swapped route', err);
      }
    }

    if (finalFlights.length === 0) {
      return handleMockSearch(normalizedQuery);
    }

    return NextResponse.json({ flights: finalFlights });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Aviationstack API integration failed. Falling back to mock data.", message);
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

interface AviationstackFlight {
    flight_status: string;
    departure: {
        scheduled: string;
        iata: string;
        airport: string;
        timezone: string;
        delay: number | null;
        gate: string | null;
        terminal: string | null;
    };
    arrival: {
        scheduled: string;
        iata: string;
        airport: string;
        timezone: string;
    };
    airline: {
        name: string;
        iata: string;
    };
    flight: {
        iata: string;
        icao: string;
        number: string;
    };
    aircraft?: {
        registration: string;
    };
}

// Helper: Map Aviationstack API response to our custom Flight interface
function mapAviationstackToFlight(avFlight: AviationstackFlight): Flight {
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

  // Parse timezone offset
  const getOffset = (scheduledTime: string) => {
    if (!scheduledTime) return "UTC";
    const match = scheduledTime.match(/([+-]\d{2}:\d{2})$/);
    return match ? `UTC${match[1]}` : "UTC";
  };

  // Map status
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

  // Clean city names
  const getCity = (airportName: string, iata: string) => {
    if (!airportName) return iata || "Unknown";
    const cleanAirport = airportName.replace(/ Airport| International/gi, "");
    const parts = cleanAirport.split(/,| -/);
    return parts[0].trim();
  };

  const getCountry = (timezone: string, iata: string) => {
    if (timezone?.includes("Oslo") || NORWAY_AIRPORTS.includes(iata)) return "Norway";
    if (timezone?.includes("London")) return "United Kingdom";
    if (timezone?.includes("Paris")) return "France";
    if (timezone?.includes("Berlin")) return "Germany";
    if (timezone?.includes("Copenhagen")) return "Denmark";
    if (timezone?.includes("Stockholm")) return "Sweden";
    if (timezone?.includes("Amsterdam")) return "Netherlands";
    return "International";
  };

  const flightNumber = avFlight.flight?.iata || avFlight.flight?.icao || `FL-${avFlight.flight?.number || "N/A"}`;

  return {
    flightNumber,
    airline: avFlight.airline?.name || "Unknown Airline",
    airlineCode: avFlight.airline?.iata || "N/A",
    departure: {
      code: avFlight.departure?.iata || "N/A",
      name: avFlight.departure?.airport || "Unknown Airport",
      city: getCity(avFlight.departure?.airport, avFlight.departure?.iata),
      country: getCountry(avFlight.departure?.timezone, avFlight.departure?.iata),
      time: depTime ? depTime.substring(0, 19) : "",
      timezone: avFlight.departure?.timezone || "UTC",
      offset: getOffset(depTime)
    },
    arrival: {
      code: avFlight.arrival?.iata || "N/A",
      name: avFlight.arrival?.airport || "Unknown Airport",
      city: getCity(avFlight.arrival?.airport, avFlight.arrival?.iata),
      country: getCountry(avFlight.arrival?.timezone, avFlight.arrival?.iata),
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

