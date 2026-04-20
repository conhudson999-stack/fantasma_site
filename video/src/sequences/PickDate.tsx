import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../brand";
import { LOADED_FONTS } from "../components/FontLoader";
import { GrainOverlay } from "../components/GrainOverlay";
import { BrowserFrame } from "../components/BrowserFrame";
import { TapIndicator } from "../components/TapIndicator";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SELECTED_DAY = 15;
const TAP_FRAME = 65;

export const PickDate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const offset = 3; // April 2026 starts on Wednesday

  return (
    <BrowserFrame>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: 32,
        }}
      >
        <GrainOverlay />
        {/* Calendar card */}
        <div
          style={{
            width: "100%",
            maxWidth: 820,
            background: "#FFFFFF",
            border: "1px solid rgba(10, 10, 10, 0.08)",
            borderRadius: 20,
            overflow: "hidden",
            opacity: cardIn,
            transform: `translateY(${interpolate(cardIn, [0, 1], [20, 0])}px)`,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 28px",
              borderBottom: "1px solid rgba(10, 10, 10, 0.08)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid rgba(10, 10, 10, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: COLORS.navy,
              }}
            >
              ‹
            </div>
            <span
              style={{
                fontFamily: LOADED_FONTS.display,
                fontSize: 36,
                letterSpacing: 2,
                color: COLORS.navy,
              }}
            >
              APRIL 2026
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid rgba(10, 10, 10, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: COLORS.navy,
              }}
            >
              ›
            </div>
          </div>
          {/* Weekdays */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              padding: "16px 20px 8px",
            }}
          >
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontFamily: LOADED_FONTS.body,
                  fontSize: 15,
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
          {/* Days */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              padding: "8px 20px 20px",
              gap: 4,
            }}
          >
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`o-${i}`} />
            ))}
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
                    fontFamily: LOADED_FONTS.body,
                    fontSize: 22,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? COLORS.navy : COLORS.navy,
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
        <TapIndicator x={480} y={920} startFrame={TAP_FRAME} />
      </div>
    </BrowserFrame>
  );
};
