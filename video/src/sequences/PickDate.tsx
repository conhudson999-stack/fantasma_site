import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";
import { TapIndicator } from "../components/TapIndicator";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SELECTED_DAY = 15;
const TAP_FRAME = 65;

export const PickDate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  // April 2026 starts on Wednesday (offset 3)
  const offset = 3;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.cream,
        position: "relative",
        padding: 60,
      }}
    >
      <GrainOverlay />
      {/* Calendar card — matches .calendar white card */}
      <div
        style={{
          width: "100%",
          maxWidth: 880,
          background: "#FFFFFF",
          border: "1px solid rgba(10, 10, 10, 0.08)",
          borderRadius: 20,
          overflow: "hidden",
          opacity: cardIn,
          transform: `translateY(${interpolate(cardIn, [0, 1], [30, 0])}px)`,
        }}
      >
        {/* Header — matches .calendar-header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "36px 40px",
            borderBottom: "1px solid rgba(10, 10, 10, 0.08)",
          }}
        >
          {/* Nav arrow left */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "1px solid rgba(10, 10, 10, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.navy,
              fontSize: 24,
            }}
          >
            ‹
          </div>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 44,
              letterSpacing: 2,
              color: COLORS.navy,
            }}
          >
            APRIL 2026
          </span>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "1px solid rgba(10, 10, 10, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.navy,
              fontSize: 24,
            }}
          >
            ›
          </div>
        </div>
        {/* Weekday headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            padding: "24px 28px 12px",
          }}
        >
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontFamily: FONTS.body,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "rgba(4, 12, 20, 0.35)",
              }}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Day grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            padding: "12px 28px 28px",
            gap: 6,
          }}
        >
          {/* Offset cells */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`offset-${i}`} />
          ))}
          {/* Day cells */}
          {days.map((day) => {
            const isSelected = day === SELECTED_DAY && frame >= TAP_FRAME;
            const isPast = day < 10;
            const selectScale = isSelected
              ? spring({ frame: frame - TAP_FRAME, fps, config: { damping: 10, stiffness: 200 } })
              : 0;

            return (
              <div
                key={day}
                style={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.body,
                  fontSize: 28,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected
                    ? COLORS.navy
                    : isPast
                    ? "rgba(4, 12, 20, 0.35)"
                    : COLORS.navy,
                  backgroundColor: isSelected ? COLORS.gold : "transparent",
                  borderRadius: 12,
                  transform: `scale(${1 + selectScale * 0.08})`,
                  opacity: isPast ? 0.35 : 1,
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
      <TapIndicator x={540} y={1050} startFrame={TAP_FRAME} />
    </div>
  );
};
