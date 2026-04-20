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

  const calendarIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const offset = 1;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.navy,
        position: "relative",
        padding: 60,
      }}
    >
      <GrainOverlay />
      <p
        style={{
          fontFamily: FONTS.display,
          fontSize: 56,
          color: COLORS.cream,
          marginBottom: 30,
          opacity: calendarIn,
        }}
      >
        APRIL 2026
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 12,
          width: "100%",
          maxWidth: 900,
          opacity: calendarIn,
        }}
      >
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              fontFamily: FONTS.body,
              fontSize: 24,
              color: `${COLORS.cream}80`,
              textAlign: "center",
              paddingBottom: 12,
            }}
          >
            {d}
          </div>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`offset-${i}`} />
        ))}
        {days.map((day) => {
          const isSelected = day === SELECTED_DAY && frame >= TAP_FRAME;
          const selectScale = isSelected
            ? spring({ frame: frame - TAP_FRAME, fps, config: { damping: 10, stiffness: 200 } })
            : 0;

          return (
            <div
              key={day}
              style={{
                width: 110,
                height: 110,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONTS.body,
                fontSize: 32,
                fontWeight: 600,
                color: isSelected ? COLORS.navy : COLORS.cream,
                backgroundColor: isSelected ? COLORS.gold : `${COLORS.cream}10`,
                transform: `scale(${1 + selectScale * 0.1})`,
                boxShadow: isSelected ? `0 0 20px ${COLORS.gold}50` : "none",
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
      <TapIndicator x={540} y={1100} startFrame={TAP_FRAME} />
    </div>
  );
};
