export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface FlightTime {
  time: string; // ISO 8601 string, e.g. 2026-06-14T08:00:00
  timezone: string; // e.g. Europe/Oslo
  offset: string; // e.g. UTC+2 or GMT+2
}

export interface Flight {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  departure: Airport & FlightTime;
  arrival: Airport & FlightTime;
  duration: string;
  status: 'Scheduled' | 'Delayed' | 'En Route' | 'Landed';
  aircraft: string;
  gate?: string;
  terminal?: string;
}

export const mockFlights: Flight[] = [
  {
    flightNumber: "DY602",
    airline: "Norwegian Air Shuttle",
    airlineCode: "DY",
    departure: {
      code: "OSL",
      name: "Oslo Airport, Gardermoen",
      city: "Oslo",
      country: "Norway",
      time: "2026-06-14T08:00:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "BGO",
      name: "Bergen Airport, Flesland",
      city: "Bergen",
      country: "Norway",
      time: "2026-06-14T08:50:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    duration: "50m",
    status: "Scheduled",
    aircraft: "Boeing 737-800",
    gate: "A12",
    terminal: "Main"
  },
  {
    flightNumber: "SK1461",
    airline: "Scandinavian Airlines (SAS)",
    airlineCode: "SK",
    departure: {
      code: "OSL",
      name: "Oslo Airport, Gardermoen",
      city: "Oslo",
      country: "Norway",
      time: "2026-06-14T10:15:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "CPH",
      name: "Copenhagen Airport, Kastrup",
      city: "Copenhagen",
      country: "Denmark",
      time: "2026-06-14T11:25:00",
      timezone: "Europe/Copenhagen",
      offset: "UTC+2"
    },
    duration: "1h 10m",
    status: "Scheduled",
    aircraft: "Airbus A320neo",
    gate: "E04",
    terminal: "3"
  },
  {
    flightNumber: "WF612",
    airline: "Widerøe",
    airlineCode: "WF",
    departure: {
      code: "BGO",
      name: "Bergen Airport, Flesland",
      city: "Bergen",
      country: "Norway",
      time: "2026-06-14T12:00:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "TOS",
      name: "Tromsø Airport, Langnes",
      city: "Tromsø",
      country: "Norway",
      time: "2026-06-14T14:05:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    duration: "2h 05m",
    status: "En Route",
    aircraft: "De Havilland Dash 8-400",
    gate: "C2",
    terminal: "Main"
  },
  {
    flightNumber: "SK4702",
    airline: "Scandinavian Airlines (SAS)",
    airlineCode: "SK",
    departure: {
      code: "OSL",
      name: "Oslo Airport, Gardermoen",
      city: "Oslo",
      country: "Norway",
      time: "2026-06-14T15:30:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "NCE",
      name: "Nice Côte d'Azur Airport",
      city: "Nice",
      country: "France",
      time: "2026-06-14T18:40:00",
      timezone: "Europe/Paris",
      offset: "UTC+2"
    },
    duration: "3h 10m",
    status: "Delayed",
    aircraft: "Airbus A320neo",
    gate: "F15",
    terminal: "2"
  },
  {
    flightNumber: "DY1340",
    airline: "Norwegian Air Shuttle",
    airlineCode: "DY",
    departure: {
      code: "OSL",
      name: "Oslo Airport, Gardermoen",
      city: "Oslo",
      country: "Norway",
      time: "2026-06-14T13:45:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "PRG",
      name: "Václav Havel Airport Prague",
      city: "Prague",
      country: "Czech Republic",
      time: "2026-06-14T15:50:00",
      timezone: "Europe/Prague",
      offset: "UTC+2"
    },
    duration: "2h 05m",
    status: "Scheduled",
    aircraft: "Boeing 737 MAX 8",
    gate: "D08",
    terminal: "1"
  },
  {
    flightNumber: "KL1142",
    airline: "KLM Royal Dutch Airlines",
    airlineCode: "KL",
    departure: {
      code: "TRD",
      name: "Trondheim Airport, Værnes",
      city: "Trondheim",
      country: "Norway",
      time: "2026-06-14T06:00:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "AMS",
      name: "Amsterdam Airport Schiphol",
      city: "Amsterdam",
      country: "Netherlands",
      time: "2026-06-14T08:15:00",
      timezone: "Europe/Amsterdam",
      offset: "UTC+2"
    },
    duration: "2h 15m",
    status: "Landed",
    aircraft: "Embraer 190",
    gate: "B03",
    terminal: "Main"
  },
  {
    flightNumber: "LH863",
    airline: "Lufthansa",
    airlineCode: "LH",
    departure: {
      code: "FRA",
      name: "Frankfurt Airport",
      city: "Frankfurt",
      country: "Germany",
      time: "2026-06-14T09:45:00",
      timezone: "Europe/Berlin",
      offset: "UTC+2"
    },
    arrival: {
      code: "OSL",
      name: "Oslo Airport, Gardermoen",
      city: "Oslo",
      country: "Norway",
      time: "2026-06-14T11:50:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    duration: "2h 05m",
    status: "Scheduled",
    aircraft: "Airbus A321",
    gate: "A26",
    terminal: "1"
  },
  {
    flightNumber: "FR8512",
    airline: "Ryanair",
    airlineCode: "FR",
    departure: {
      code: "STN",
      name: "London Stansted Airport",
      city: "London",
      country: "United Kingdom",
      time: "2026-06-14T17:25:00",
      timezone: "Europe/London",
      offset: "UTC+1"
    },
    arrival: {
      code: "TRF",
      name: "Sandefjord Airport, Torp",
      city: "Sandefjord",
      country: "Norway",
      time: "2026-06-14T20:25:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    duration: "2h 00m",
    status: "Scheduled",
    aircraft: "Boeing 737-800",
    gate: "G4",
    terminal: "Main"
  },
  {
    flightNumber: "SK843",
    airline: "Scandinavian Airlines (SAS)",
    airlineCode: "SK",
    departure: {
      code: "OSL",
      name: "Oslo Airport, Gardermoen",
      city: "Oslo",
      country: "Norway",
      time: "2026-06-14T07:30:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "ARN",
      name: "Stockholm Arlanda Airport",
      city: "Stockholm",
      country: "Sweden",
      time: "2026-06-14T08:25:00",
      timezone: "Europe/Stockholm",
      offset: "UTC+2"
    },
    duration: "55m",
    status: "Landed",
    aircraft: "Bombardier CRJ-900",
    gate: "A08",
    terminal: "5"
  },
  {
    flightNumber: "DY1800",
    airline: "Norwegian Air Shuttle",
    airlineCode: "DY",
    departure: {
      code: "OSL",
      name: "Oslo Airport, Gardermoen",
      city: "Oslo",
      country: "Norway",
      time: "2026-06-14T06:15:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "AGP",
      name: "Málaga Airport",
      city: "Málaga",
      country: "Spain",
      time: "2026-06-14T10:15:00",
      timezone: "Europe/Madrid",
      offset: "UTC+2"
    },
    duration: "4h 00m",
    status: "Scheduled",
    aircraft: "Boeing 737-800",
    gate: "F12",
    terminal: "Main"
  },
  {
    flightNumber: "WF143",
    airline: "Widerøe",
    airlineCode: "WF",
    departure: {
      code: "BOO",
      name: "Bodø Airport",
      city: "Bodø",
      country: "Norway",
      time: "2026-06-14T19:30:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "SVJ",
      name: "Svolvær Airport, Helle",
      city: "Svolvær",
      country: "Norway",
      time: "2026-06-14T19:55:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    duration: "25m",
    status: "Scheduled",
    aircraft: "De Havilland Dash 8-100",
    gate: "1",
    terminal: "Main"
  },
  {
    flightNumber: "W62401",
    airline: "Wizz Air",
    airlineCode: "W6",
    departure: {
      code: "GDN",
      name: "Gdańsk Lech Wałęsa Airport",
      city: "Gdańsk",
      country: "Poland",
      time: "2026-06-14T11:10:00",
      timezone: "Europe/Warsaw",
      offset: "UTC+2"
    },
    arrival: {
      code: "TOS",
      name: "Tromsø Airport, Langnes",
      city: "Tromsø",
      country: "Norway",
      time: "2026-06-14T13:45:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    duration: "2h 35m",
    status: "Scheduled",
    aircraft: "Airbus A321neo",
    gate: "4",
    terminal: "Main"
  },
  {
    flightNumber: "DY750",
    airline: "Norwegian Air Shuttle",
    airlineCode: "DY",
    departure: {
      code: "OSL",
      name: "Oslo Airport, Gardermoen",
      city: "Oslo",
      country: "Norway",
      time: "2026-06-14T17:35:00",
      timezone: "Europe/Oslo",
      offset: "UTC+2"
    },
    arrival: {
      code: "LHR",
      name: "London Heathrow Airport",
      city: "London",
      country: "United Kingdom",
      time: "2026-06-14T19:00:00",
      timezone: "Europe/London",
      offset: "UTC+1"
    },
    duration: "2h 25m",
    status: "Scheduled",
    aircraft: "Boeing 737 MAX 8",
    gate: "D15",
    terminal: "4"
  }
];
