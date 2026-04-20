import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";
import { TapIndicator } from "../components/TapIndicator";

const TIME_SLOTS = ["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];
const SELECTED_INDEX = 2; // "5:00 PM"
const TAP_FRAME = 55;

export const SelectTime: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

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
        padding: 80,
      }}
    >
      <GrainOverlay />
      {/* Session type pills — matches .session-type-selector */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 32,
          opacity: panelIn,
        }}
      >
        <div
          style={{
            padding: "18px 48px",
            borderRadius: 9999,
            background: COLORS.gold,
            color: COLORS.navy,
            fontFamily: FONTS.body,
            fontSize: 26,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          1-on-1
        </div>
        <div
          style={{
            padding: "18px 48px",
            borderRadius: 9999,
            background: "#FFFFFF",
            border: "1px solid rgba(10, 10, 10, 0.08)",
            color: "rgba(4, 12, 20, 0.6)",
            fontFamily: FONTS.body,
            fontSize: 26,
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          Small Group
        </div>
      </div>
      {/* Slots panel — matches .slots-panel white card */}
      <div
        style={{
          width: "100%",
          maxWidth: 800,
          background: "#FFFFFF",
          border: "1px solid rgba(10, 10, 10, 0.08)",
          borderRadius: 20,
          padding: 40,
          opacity: panelIn,
          transform: `translateY(${interpolate(panelIn, [0, 1], [20, 0])}px)`,
        }}
      >
        <p
          style={{
            fontFamily: FONTS.display,
            fontSize: 38,
            letterSpacing: 1,
            color: COLORS.navy,
            marginBottom: 6,
          }}
        >
          AVAILABLE TIMES
        </p>
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: COLORS.gold,
            marginBottom: 28,
          }}
        >
          TUESDAY, APRIL 15
        </p>
        {/* Slot pills in 3-col grid — matches .slots-grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
          }}
        >
          {TIME_SLOTS.map((slot, i) => {
            const isSelected = i === SELECTED_INDEX && frame >= TAP_FRAME;
            const selectSpring = isSelected
              ? spring({ frame: frame - TAP_FRAME, fps, config: { damping: 12, stiffness: 180 } })
              : 0;

            return (
              <div
                key={slot}
                style={{
                  padding: "20px 16px",
                  borderRadius: 9999,
                  backgroundColor: isSelected ? COLORS.gold : "#FFFFFF",
                  border: `1px solid ${isSelected ? COLORS.gold : "rgba(10, 10, 10, 0.08)"}`,
                  fontFamily: FONTS.body,
                  fontSize: 28,
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? COLORS.navy : COLORS.navy,
                  textAlign: "center",
                  transform: `scale(${1 + selectSpring * 0.04})`,
                }}
              >
                {slot}
              </div>
            );
          })}
        </div>
      </div>
      <TapIndicator x={540} y={1100} startFrame={TAP_FRAME} />
    </div>
  );
};
