"use client";

import React, { useState, FormEvent } from "react";
import Image from "next/image";
import { 
  Search, 
  Plane, 
  Calendar, 
  MapPin, 
  AlertCircle, 
  Globe, 
  Compass, 
  Info
} from "lucide-react";
import { Flight } from "@/data/mockFlights";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Perform search query
  const handleSearch = async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed) {
      setError("Please enter a flight number or city to search.");
      return;
    }

    setError(null);
    setLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/flights?query=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch flight details. Please try again.");
      }
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setFlights(data.flights || []);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };


  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleChipClick = (flightNum: string) => {
    setSearchQuery(flightNum);
    handleSearch(flightNum);
  };

  // Date/Time formatting helper
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="app-container">
      {/* Hero Header Section */}
      <header className="hero">
        <Image src="/logo.png" alt="Flights-Tracker Norway Logo" width={120} height={120} className="hero-logo" />
        <p className="hero-subtitle" style={{ marginTop: "0.5rem" }}>
          Track departures, arrivals, timezones, and real-time schedules for all flights traveling to or from Norway.
        </p>
      </header>

      {/* Main Search Panel */}
      <section className="glass-panel search-container">
        <form onSubmit={onSubmit} className="search-form">
          <div className="form-group">
            <label htmlFor="flight-search" className="search-label">
              <span>Flight Search</span>
              <span className="search-label-hint">Enter flight number (e.g. DY602) or Norwegian airport/city</span>
            </label>
            <div className="input-wrapper">
              <Search className="input-icon" size={20} />
              <input
                id="flight-search"
                type="text"
                className="search-input"
                placeholder="Search flight number, city, or airport code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {error && (
            <div className="error-box" role="alert">
              <AlertCircle className="error-icon" size={20} />
              <div>{error}</div>
            </div>
          )}

          <div className="action-row">
            <div className="suggestion-chips">
              <span className="suggestion-label">Suggested:</span>
              <button 
                type="button" 
                className="chip-btn" 
                onClick={() => handleChipClick("DY602")}
                id="suggest-dy602"
              >
                DY602 (Oslo → Bergen)
              </button>
              <button 
                type="button" 
                className="chip-btn" 
                onClick={() => handleChipClick("SK4702")}
                id="suggest-sk4702"
              >
                SK4702 (Oslo → Nice)
              </button>
              <button 
                type="button" 
                className="chip-btn" 
                onClick={() => handleChipClick("WF612")}
                id="suggest-wf612"
              >
                WF612 (Bergen → Tromsø)
              </button>
              <button 
                type="button" 
                className="chip-btn" 
                onClick={() => handleChipClick("LH863")}
                id="suggest-lh863"
              >
                LH863 (Frankfurt → Oslo)
              </button>
            </div>

            <button type="submit" className="search-btn" disabled={loading} id="search-submit-btn">
              {loading ? (
                <span>Searching...</span>
              ) : (
                <>
                  <Search size={18} />
                  <span>Search Flights</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Flight Search Results Panel */}
      <section className="results-section">
        {hasSearched && (
          <div className="results-header">
            <h2 className="results-title">
              <Plane size={22} style={{ transform: "rotate(45deg)", color: "var(--primary)" }} />
              Flight Search Results
            </h2>
            {!loading && (
              <span className="results-count">
                {flights.length} {flights.length === 1 ? "flight" : "flights"} found
              </span>
            )}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="skeleton-card">
              <div className="skeleton-shimmer" />
            </div>
            <div className="skeleton-card">
              <div className="skeleton-shimmer" />
            </div>
          </div>
        )}

        {/* Search Results List */}
        {!loading && hasSearched && flights.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {flights.map((flight) => (
              <article 
                key={flight.flightNumber} 
                className="glass-panel flight-card"
                id={`flight-card-${flight.flightNumber}`}
              >
                {/* Airline & Status Sidebar */}
                <div className="card-sidebar">
                  <div className="airline-badge">
                    <div className="airline-logo-box" aria-hidden="true">
                      <Plane size={20} style={{ transform: "rotate(45deg)" }} />
                    </div>
                    <div className="airline-name-group">
                      <span className="airline-name">{flight.airline}</span>
                      <span className="flight-num-label">{flight.flightNumber}</span>
                    </div>
                  </div>

                  <span className={`status-pill ${flight.status.toLowerCase().replace(" ", "")}`}>
                    <span className="status-pulse" />
                    {flight.status}
                  </span>
                </div>

                {/* Flight Route Map & Timelines */}
                <div className="card-main">
                  {/* Route Visualizer */}
                  <div className="route-visualizer">
                    <div className="route-node origin">
                      <span className="node-code">{flight.departure.code}</span>
                      <span className="node-city">{flight.departure.city}</span>
                      <span className="node-country">{flight.departure.country}</span>
                    </div>

                    <div className="route-path">
                      <div className="route-line">
                        <Plane size={14} className="route-plane" />
                      </div>
                      <span className="route-duration" aria-label={`Flight duration ${flight.duration}`}>
                        {flight.duration}
                      </span>
                    </div>

                    <div className="route-node destination">
                      <span className="node-code">{flight.arrival.code}</span>
                      <span className="node-city">{flight.arrival.city}</span>
                      <span className="node-country">{flight.arrival.country}</span>
                    </div>
                  </div>

                  {/* Date, Time, Airport, and Timezone Grid */}
                  <div className="flight-details-grid">
                    {/* Departure Block */}
                    <div className="detail-block">
                      <div className="detail-block-header">
                        <MapPin size={16} />
                        <span>Departure</span>
                      </div>
                      <div className="detail-time">
                        {formatTime(flight.departure.time)}
                        <span className="detail-timezone-badge" title="Timezone Offset">
                          {flight.departure.offset}
                        </span>
                      </div>
                      <div className="detail-date">
                        <Calendar size={13} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
                        <span>{formatDate(flight.departure.time)}</span>
                      </div>
                      <div className="detail-airport">
                        <strong>{flight.departure.name}</strong>
                        <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <Globe size={12} />
                          <span>Timezone: {flight.departure.timezone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrival Block */}
                    <div className="detail-block">
                      <div className="detail-block-header">
                        <MapPin size={16} />
                        <span>Arrival</span>
                      </div>
                      <div className="detail-time">
                        {formatTime(flight.arrival.time)}
                        <span className="detail-timezone-badge" title="Timezone Offset">
                          {flight.arrival.offset}
                        </span>
                      </div>
                      <div className="detail-date">
                        <Calendar size={13} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
                        <span>{formatDate(flight.arrival.time)}</span>
                      </div>
                      <div className="detail-airport">
                        <strong>{flight.arrival.name}</strong>
                        <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <Globe size={12} />
                          <span>Timezone: {flight.arrival.timezone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flight Equipment & Terminal Meta */}
                  <div className="card-footer">
                    <div className="footer-item">
                      <span>Aircraft:</span>
                      <strong>{flight.aircraft}</strong>
                    </div>
                    {flight.gate && (
                      <div className="footer-item">
                        <span>Gate:</span>
                        <strong>{flight.gate}</strong>
                      </div>
                    )}
                    {flight.terminal && (
                      <div className="footer-item">
                        <span>Terminal:</span>
                        <strong>{flight.terminal}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty Search Results */}
        {!loading && hasSearched && flights.length === 0 && (
          <div className="glass-panel empty-state">
            <div className="empty-icon-box">
              <Compass size={36} />
            </div>
            <h3 className="empty-title">No matching flights found</h3>
            <p className="empty-message">
              We couldn&apos;t find any flights matching <strong>&quot;{searchQuery}&quot;</strong>. 
              Norway Flight Board only records flights to and from Norway.
            </p>
            <div style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Info size={14} style={{ color: "var(--secondary)" }} />
              <span>Try typing <strong>DY602</strong>, <strong>SK1461</strong>, <strong>WF612</strong>, or <strong>LH863</strong>.</span>
            </div>
          </div>
        )}

        {/* Initial landing state */}
        {!loading && !hasSearched && (
          <div className="glass-panel empty-state" style={{ borderStyle: "dashed", opacity: 0.8 }}>
            <div className="empty-icon-box" style={{ color: "var(--primary)" }}>
              <Plane size={36} style={{ transform: "rotate(45deg)" }} />
            </div>
            <h3 className="empty-title">Ready for Search</h3>
            <p className="empty-message">
              Enter a flight number or click one of the suggested flight chips above to inspect schedules, locations, duration, and timezones.
            </p>
          </div>
        )}
      </section>

      {/* Footer layout */}
      <footer className="footer">
        <div>
          <span>NorgeFly Flight Lookup Board &copy; {new Date().getFullYear()}</span>
        </div>
        <div>
          <span>Data simulated for flights departing and arriving in Norway.</span>
        </div>
      </footer>
    </div>
  );
}
