"use client";
import type { Match } from "@/lib/types";
import PitchReportCard from "./PitchReportCard";
import LineupsCard from "./LineupsCard";
import { PITCH_REPORTS } from "@/lib/mockData";

// ── Mock weather by city ──────────────────────────────────────────────────────
const CITY_WEATHER: Record<string, { icon: string; condition: string; tempC: number; humidity: number; windKmh: number; rainChance: number }> = {
  // England
  "London":        { icon: "🌤️", condition: "Partly Cloudy",      tempC: 18, humidity: 68, windKmh: 14, rainChance: 20 },
  "Leeds":         { icon: "⛅",  condition: "Overcast",            tempC: 16, humidity: 74, windKmh: 18, rainChance: 35 },
  "Birmingham":    { icon: "🌦️", condition: "Showers Likely",      tempC: 15, humidity: 76, windKmh: 16, rainChance: 45 },
  "Manchester":    { icon: "🌧️", condition: "Light Rain",          tempC: 14, humidity: 80, windKmh: 20, rainChance: 60 },
  "Nottingham":    { icon: "⛅",  condition: "Cloudy",              tempC: 17, humidity: 70, windKmh: 15, rainChance: 30 },
  "Southampton":   { icon: "🌤️", condition: "Mostly Sunny",        tempC: 19, humidity: 62, windKmh: 12, rainChance: 15 },
  // India
  "Mumbai":        { icon: "🌫️", condition: "Humid & Hazy",        tempC: 30, humidity: 76, windKmh: 20, rainChance: 10 },
  "Chennai":       { icon: "☀️", condition: "Hot & Sunny",          tempC: 32, humidity: 80, windKmh: 15, rainChance: 5  },
  "Kolkata":       { icon: "🌤️", condition: "Warm & Hazy",         tempC: 31, humidity: 72, windKmh: 12, rainChance: 15 },
  "Bengaluru":     { icon: "🌤️", condition: "Pleasant",            tempC: 25, humidity: 58, windKmh: 10, rainChance: 10 },
  "Bangalore":     { icon: "🌤️", condition: "Pleasant",            tempC: 25, humidity: 58, windKmh: 10, rainChance: 10 },
  "Delhi":         { icon: "☀️", condition: "Hot & Hazy",           tempC: 36, humidity: 40, windKmh: 8,  rainChance: 5  },
  "Hyderabad":     { icon: "☀️", condition: "Warm & Sunny",         tempC: 33, humidity: 55, windKmh: 10, rainChance: 5  },
  "Ahmedabad":     { icon: "☀️", condition: "Hot & Dry",            tempC: 38, humidity: 30, windKmh: 8,  rainChance: 2  },
  "Jaipur":        { icon: "☀️", condition: "Hot & Sunny",          tempC: 37, humidity: 28, windKmh: 10, rainChance: 2  },
  "Lucknow":       { icon: "☀️", condition: "Hot & Humid",          tempC: 34, humidity: 52, windKmh: 10, rainChance: 8  },
  "Chandigarh":    { icon: "🌤️", condition: "Warm & Clear",        tempC: 30, humidity: 48, windKmh: 12, rainChance: 8  },
  // Australia
  "Sydney":        { icon: "☀️", condition: "Clear & Sunny",        tempC: 22, humidity: 58, windKmh: 16, rainChance: 10 },
  "Melbourne":     { icon: "⛅",  condition: "Partly Cloudy",       tempC: 17, humidity: 64, windKmh: 20, rainChance: 25 },
  "Brisbane":      { icon: "☀️", condition: "Warm & Sunny",         tempC: 26, humidity: 62, windKmh: 14, rainChance: 8  },
  "Perth":         { icon: "☀️", condition: "Sunny & Warm",         tempC: 20, humidity: 52, windKmh: 18, rainChance: 5  },
  "Adelaide":      { icon: "☀️", condition: "Clear & Warm",         tempC: 21, humidity: 50, windKmh: 14, rainChance: 5  },
  "Hobart":        { icon: "🌤️", condition: "Cool & Breezy",       tempC: 13, humidity: 68, windKmh: 22, rainChance: 20 },
  // Pakistan
  "Lahore":        { icon: "☀️", condition: "Hot & Sunny",          tempC: 38, humidity: 35, windKmh: 8,  rainChance: 3  },
  "Karachi":       { icon: "☀️", condition: "Warm & Hazy",          tempC: 35, humidity: 60, windKmh: 12, rainChance: 3  },
  "Rawalpindi":    { icon: "🌤️", condition: "Warm & Clear",        tempC: 32, humidity: 45, windKmh: 10, rainChance: 5  },
  "Peshawar":      { icon: "☀️", condition: "Hot & Dry",            tempC: 35, humidity: 32, windKmh: 8,  rainChance: 3  },
  "Multan":        { icon: "☀️", condition: "Hot & Dry",            tempC: 40, humidity: 28, windKmh: 8,  rainChance: 2  },
  "Islamabad":     { icon: "🌤️", condition: "Partly Cloudy",       tempC: 30, humidity: 50, windKmh: 12, rainChance: 15 },
  // South Africa
  "Cape Town":     { icon: "🌤️", condition: "Sunny & Windy",       tempC: 18, humidity: 62, windKmh: 24, rainChance: 10 },
  "Johannesburg":  { icon: "⛅",  condition: "Partly Cloudy",       tempC: 19, humidity: 54, windKmh: 14, rainChance: 20 },
  "Durban":        { icon: "☀️", condition: "Warm & Humid",         tempC: 24, humidity: 72, windKmh: 16, rainChance: 15 },
  "Centurion":     { icon: "☀️", condition: "Clear & Warm",         tempC: 22, humidity: 48, windKmh: 12, rainChance: 10 },
  "Gqeberha":      { icon: "🌤️", condition: "Mild & Breezy",       tempC: 20, humidity: 65, windKmh: 18, rainChance: 15 },
  "Paarl":         { icon: "☀️", condition: "Warm & Clear",         tempC: 22, humidity: 55, windKmh: 14, rainChance: 8  },
  "East London":   { icon: "🌤️", condition: "Coastal Breeze",      tempC: 21, humidity: 65, windKmh: 20, rainChance: 15 },
  // West Indies
  "Port of Spain": { icon: "🌤️", condition: "Tropical & Warm",     tempC: 28, humidity: 78, windKmh: 16, rainChance: 25 },
  "Bridgetown":    { icon: "☀️", condition: "Sunny & Breezy",       tempC: 27, humidity: 75, windKmh: 18, rainChance: 15 },
  "Kingston":      { icon: "☀️", condition: "Warm & Sunny",         tempC: 29, humidity: 72, windKmh: 14, rainChance: 20 },
  "Gros Islet":    { icon: "🌤️", condition: "Partly Cloudy",       tempC: 27, humidity: 76, windKmh: 18, rainChance: 20 },
  // Sri Lanka
  "Colombo":       { icon: "🌦️", condition: "Tropical Showers",    tempC: 29, humidity: 82, windKmh: 14, rainChance: 40 },
  "Kandy":         { icon: "⛅",  condition: "Warm & Cloudy",       tempC: 26, humidity: 78, windKmh: 10, rainChance: 30 },
  "Galle":         { icon: "🌤️", condition: "Warm & Breezy",       tempC: 27, humidity: 76, windKmh: 18, rainChance: 20 },
  // Bangladesh
  "Dhaka":         { icon: "🌤️", condition: "Hot & Humid",         tempC: 30, humidity: 80, windKmh: 12, rainChance: 20 },
  "Chittagong":    { icon: "⛅",  condition: "Warm & Humid",        tempC: 29, humidity: 78, windKmh: 14, rainChance: 25 },
  // New Zealand
  "Auckland":      { icon: "🌤️", condition: "Mild & Breezy",       tempC: 16, humidity: 70, windKmh: 20, rainChance: 30 },
  "Wellington":    { icon: "🌬️", condition: "Windy & Cool",        tempC: 13, humidity: 72, windKmh: 35, rainChance: 40 },
  "Christchurch":  { icon: "☀️", condition: "Clear & Cool",         tempC: 14, humidity: 60, windKmh: 18, rainChance: 15 },
  // USA
  "Dallas":        { icon: "☀️", condition: "Hot & Clear",          tempC: 36, humidity: 42, windKmh: 14, rainChance: 10 },
  "New York":      { icon: "🌤️", condition: "Partly Cloudy",       tempC: 22, humidity: 60, windKmh: 16, rainChance: 20 },
  "Morrisville":   { icon: "🌤️", condition: "Warm & Partly Cloudy",tempC: 28, humidity: 65, windKmh: 14, rainChance: 15 },
  "Lauderhill":    { icon: "☀️", condition: "Warm & Sunny",         tempC: 30, humidity: 72, windKmh: 16, rainChance: 20 },
  "Grand Prairie": { icon: "☀️", condition: "Hot & Sunny",          tempC: 37, humidity: 40, windKmh: 12, rainChance: 8  },
  "Seattle":       { icon: "🌧️", condition: "Light Rain",           tempC: 16, humidity: 75, windKmh: 14, rainChance: 55 },
  "San Francisco": { icon: "🌫️", condition: "Foggy & Cool",        tempC: 15, humidity: 78, windKmh: 18, rainChance: 20 },
  "Washington":    { icon: "⛅",  condition: "Partly Cloudy",       tempC: 24, humidity: 62, windKmh: 14, rainChance: 25 },
  // Afghanistan
  "Kabul":         { icon: "☀️", condition: "Hot & Dry",            tempC: 32, humidity: 25, windKmh: 10, rainChance: 2  },
  // Ireland
  "Dublin":        { icon: "🌦️", condition: "Showers Possible",    tempC: 13, humidity: 78, windKmh: 18, rainChance: 50 },
};

const DEFAULT_WEATHER = { icon: "🌤️", condition: "Check closer to match", tempC: 24, humidity: 60, windKmh: 12, rainChance: 15 };

function getRainLabel(pct: number) {
  if (pct <= 10) return { label: "Very Low", color: "#22c55e" };
  if (pct <= 25) return { label: "Low",      color: "#84cc16" };
  if (pct <= 45) return { label: "Moderate", color: "#eab308" };
  if (pct <= 65) return { label: "High",     color: "#f97316" };
  return             { label: "Very High",   color: "#ef4444" };
}

function fmt12(h: number, m: number) {
  const ap = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

function formatMatchTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.round(diffMs / 3600000);
  const diffD = Math.round(diffMs / 86400000);

  const dateStr = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });

  // IST = UTC + 5:30
  const istTotalMin = d.getUTCHours() * 60 + d.getUTCMinutes() + 330;
  const istH = Math.floor(istTotalMin / 60) % 24;
  const istM = istTotalMin % 60;
  const istStr = `${fmt12(istH, istM)} IST`;
  const utcStr = `${fmt12(d.getUTCHours(), d.getUTCMinutes())} UTC`;

  let countdown = "";
  if (diffMs < 0) {
    countdown = "Match started";
  } else if (diffH < 1) {
    countdown = "Starting soon";
  } else if (diffH < 24) {
    countdown = `in ${diffH}h`;
  } else if (diffD === 1) {
    countdown = "Tomorrow";
  } else {
    countdown = `in ${diffD} days`;
  }

  return { dateStr, timeStr, utcStr, countdown };
}

interface InfoTabProps {
  match: Match;
}

export default function InfoTab({ match }: InfoTabProps) {
  const pitch = PITCH_REPORTS[match.venue.id];
  const weather = CITY_WEATHER[match.venue.city] ?? DEFAULT_WEATHER;
  const rain = getRainLabel(weather.rainChance);
  const isUpcoming = match.status === "upcoming" || match.status === "pre-match";
  const { dateStr, timeStr, utcStr, countdown } = formatMatchTime(match.startTimeIso);

  return (
    <div className="space-y-4">

      {/* ── Date & Time ───────────────────────────────────────────────── */}
      <div className="card px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">Match Date & Time</div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary leading-snug">{dateStr}</div>
            <div className="text-xs text-text-secondary mt-0.5">{timeStr} local · {match.venue.city} ({utcStr})</div>
            <div className="text-[10px] text-text-dim mt-0.5">{match.competition.name} · {match.matchNumber}</div>
          </div>
          <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
            style={{ background: isUpcoming ? "#00A0C622" : "#22c55e22",
                     color: isUpcoming ? "#00A0C6" : "#22c55e" }}>
            {countdown}
          </span>
        </div>
      </div>

      {/* ── Weather Forecast ──────────────────────────────────────────── */}
      <div className="card px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">
          Weather Forecast · {match.venue.city}
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary leading-snug flex items-center gap-1.5">
              <span className="text-base leading-none">{weather.icon}</span>
              <span>{weather.tempC}°C</span>
            </div>
            {/* All four stats in one row */}
            <div className="text-xs text-text-secondary mt-0.5 flex items-center flex-wrap gap-x-1 gap-y-0">
              <span>{weather.condition}</span>
              <span className="text-text-dim">·</span>
              <span>💧 {weather.humidity}%</span>
              <span className="text-text-dim">·</span>
              <span>💨 {weather.windKmh} km/h</span>
              <span className="text-text-dim">·</span>
              <span>🌧️ {weather.rainChance}%</span>
            </div>
            {weather.rainChance >= 30 && (
              <div className="text-[10px] mt-0.5" style={{ color: rain.color }}>
                {rain.label} rain risk · may affect play
              </div>
            )}
          </div>
          {weather.rainChance >= 30 && (
            <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
              style={{ background: `${rain.color}22`, color: rain.color }}>
              ⚠️ Rain
            </span>
          )}
        </div>
      </div>

      {/* ── Match Context ─────────────────────────────────────────────── */}
      <div className="card px-4 py-3 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Match Context</div>
        <div className="text-sm">
          <span className="font-bold">{match.teamA.shortName}</span>
          {match.teamA.flagEmoji && <span className="ml-1">{match.teamA.flagEmoji}</span>}
          <span className="text-text-dim"> vs </span>
          <span className="font-bold">{match.teamB.shortName}</span>
          {match.teamB.flagEmoji && <span className="ml-1">{match.teamB.flagEmoji}</span>}
          <span className="text-text-secondary"> · {match.competition.name}</span>
        </div>
        <div className="text-xs text-text-secondary">{match.venue.name}, {match.venue.city}</div>
        {match.toss && (
          <div className="text-xs text-text-secondary">
            Toss: <span className="text-text-primary font-semibold">{match.toss.winner}</span> won and chose to {match.toss.elected}
          </div>
        )}
        {match.summary && (
          <p className="text-xs text-text-secondary leading-relaxed border-t border-line pt-2">{match.summary}</p>
        )}
      </div>

      {/* ── Pitch Report ──────────────────────────────────────────────── */}
      {pitch && <PitchReportCard pitch={pitch} venue={match.venue} />}

      {/* ── Squads ────────────────────────────────────────────────────── */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">Squads</div>
        <LineupsCard match={match} />
      </div>

    </div>
  );
}
