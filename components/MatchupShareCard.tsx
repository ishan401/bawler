"use client";
// MatchupShareCard — static image rendered off-screen for PNG capture.
// Same data as MatchupCard but opinionated layout for a 375×420 shareable card.
// No hover states, no interactive elements.

import type { MatchupStats, MatchFormat } from "@/lib/types";

interface MatchupShareCardProps {
  stats: MatchupStats | null;
  batterName: string;
  bowlerName: string;
  battingTeamName: string;
  bowlingTeamName: string;
  battingTeamColor: string;
  bowlingTeamColor: string;
  format: MatchFormat;
}

export default function MatchupShareCard({
  stats,
  batterName,
  bowlerName,
  battingTeamName,
  bowlingTeamName,
  battingTeamColor,
  bowlingTeamColor,
  format,
}: MatchupShareCardProps) {
  const avg = stats
    ? stats.timesOut === 0 ? "∞" : (stats.runsScored / stats.timesOut).toFixed(1)
    : null;
  const sr = stats
    ? ((stats.runsScored / stats.ballsFaced) * 100).toFixed(1)
    : null;
  const dotPct = stats
    ? Math.round((stats.dotBalls / stats.ballsFaced) * 100)
    : null;
  const primaryDismissal = stats?.dismissalTypes.length
    ? [...stats.dismissalTypes].sort((a, b) => b.count - a.count)[0]
    : null;
  const formatLabel: Record<MatchFormat, string> = {
    T20: "T20", T20I: "T20I", ODI: "ODI", Test: "Test", Hundred: "100-ball",
  };

  return (
    <div
      style={{
        width: 375,
        background: "#070B14",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        borderRadius: 20,
      }}
    >
      {/* ── Top colour bar ── */}
      <div style={{ display: "flex", height: 4 }}>
        <div style={{ flex: 1, background: battingTeamColor }} />
        <div style={{ flex: 1, background: bowlingTeamColor }} />
      </div>

      {/* ── Branding header ── */}
      <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 4, color: "#FFFFFF40", textTransform: "uppercase" }}>
          BAWLER
        </span>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
          padding: "2px 8px", borderRadius: 4, background: "#FFFFFF12", color: "#FFFFFF60",
        }}>
          {formatLabel[format]} MATCHUP
        </span>
      </div>

      {/* ── Names ── */}
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Batter side */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: battingTeamColor, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            {battingTeamName}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: battingTeamColor, lineHeight: 1 }}>
            {batterName}
          </div>
          <div style={{ fontSize: 10, color: "#FFFFFF40", marginTop: 3 }}>BATTER</div>
        </div>

        {/* vs bubble */}
        <div style={{
          width: 40, height: 40, borderRadius: 20,
          background: "#FFFFFF0A", border: "1px solid #FFFFFF15",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, margin: "0 12px",
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: "#FFFFFF50" }}>vs</span>
        </div>

        {/* Bowler side */}
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: bowlingTeamColor, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            {bowlingTeamName}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: bowlingTeamColor, lineHeight: 1 }}>
            {bowlerName}
          </div>
          <div style={{ fontSize: 10, color: "#FFFFFF40", marginTop: 3 }}>BOWLER</div>
        </div>
      </div>

      {stats ? (
        <>
          {/* ── Divider ── */}
          <div style={{ height: 1, background: "#FFFFFF10", margin: "20px 20px 0" }} />

          {/* ── Big stat row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "20px 0 0" }}>
            <BigStat label="BALLS FACED" value={stats.ballsFaced} color="#E2E8F0" />
            <BigStat label="RUNS SCORED" value={stats.runsScored} color="#22D3EE" />
            <BigStat
              label={stats.timesOut === 1 ? "DISMISSAL" : "DISMISSALS"}
              value={stats.timesOut}
              color={stats.timesOut >= 3 ? "#F87171" : stats.timesOut === 0 ? "#4ADE80" : "#FB923C"}
            />
          </div>

          {/* ── Secondary stats ── */}
          <div style={{
            display: "flex", gap: 24, padding: "14px 20px",
            borderTop: "1px solid #FFFFFF10", marginTop: 16,
          }}>
            <SecStat label="AVG" value={avg!} />
            <SecStat label="STRIKE RATE" value={sr!} />
            <SecStat label="DOT BALLS" value={`${dotPct}%`} />
            <SecStat label="SIXES" value={String(stats.sixes)} />
          </div>

          {/* ── Insight box ── */}
          {(primaryDismissal || stats.dangerDelivery) && (
            <div style={{
              margin: "0 20px 20px", padding: "12px 14px",
              background: "#FFFFFF07", borderRadius: 12,
              border: "1px solid #FFFFFF0F",
            }}>
              {primaryDismissal && stats.timesOut > 0 && (
                <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5, marginBottom: stats.dangerDelivery ? 8 : 0 }}>
                  <span style={{ color: "#F87171", fontWeight: 700 }}>■ </span>
                  <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{bowlerName.split(" ").pop()}</span>
                  {" has dismissed "}
                  <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{batterName.split(" ").pop()}</span>
                  {" "}
                  <span style={{ color: "#F87171", fontWeight: 800 }}>{stats.timesOut}×</span>
                  {" — "}
                  {primaryDismissal.type.toLowerCase()}
                  {stats.lastDismissal && (
                    <span style={{ color: "#FFFFFF40" }}> · {stats.lastDismissal}</span>
                  )}
                </div>
              )}
              {stats.timesOut === 0 && (
                <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5, marginBottom: stats.dangerDelivery ? 8 : 0 }}>
                  <span style={{ color: "#4ADE80", fontWeight: 700 }}>✦ </span>
                  <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{batterName.split(" ").pop()}</span>
                  {" has "}
                  <span style={{ color: "#4ADE80", fontWeight: 800 }}>never</span>
                  {" been dismissed by "}
                  <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{bowlerName.split(" ").pop()}</span>
                </div>
              )}
              {stats.dangerDelivery && (
                <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5 }}>
                  <span style={{ color: "#FB923C", fontWeight: 700 }}>⚡ </span>
                  <span style={{ color: "#FB923C", fontWeight: 600 }}>Danger: </span>
                  {stats.dangerDelivery}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>
            First {formatLabel[format]} Meeting
          </div>
          <div style={{ fontSize: 12, color: "#FFFFFF40" }}>No previous record in this format</div>
        </div>
      )}

      {/* ── Bottom colour bar ── */}
      <div style={{ display: "flex", height: 3 }}>
        <div style={{ flex: 1, background: battingTeamColor }} />
        <div style={{ flex: 1, background: bowlingTeamColor }} />
      </div>
    </div>
  );
}

function BigStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: "center", padding: "0 8px" }}>
      <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#FFFFFF40", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function SecStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, color: "#FFFFFF40", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
