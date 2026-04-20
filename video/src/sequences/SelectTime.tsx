import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";
import { TapIndicator } from "../components/TapIndicator";

const TIME_SLOTS = ["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];
const SELECTED_INDEX = 2;
const TAP_FRAME = 55;

export const SelectTime: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideUp = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

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
        padding: 80,
      }}
    >
      <GrainOverlay />
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 28,
          color: `${COLORS.cream}80`,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 16,
          opacity: slideUp,
        }}
      >
        1-on-1 Training
      </p>
      <p
        style={{
          fontFamily: FONTS.display,
          fontSize: 52,
          color: COLORS.cream,
          marginBottom: 50,
          opacity: slideUp,
        }}
      >
        AVAILABLE TIMES
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: "100%",
          maxWidth: 700,
          transform: `translateY(${interpolate(slideUp, [0, 1], [80, 0])}px)`,
          opacity: slideUp,
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
                padding: "28px 40px",
                borderRadius: 16,
                backgroundColor: isSelected ? COLORS.gold : `${COLORS.cream}12`,
                border: `2px solid ${isSelected ? COLORS.gold : COLORS.cream}30`,
                fontFamily: FONTS.body,
                fontSize: 36,
                fontWeight: 600,
                color: isSelected ? COLORS.navy : COLORS.cream,
                textAlign: "center",
                transform: `scale(${1 + selectSpring * 0.04})`,
              }}
            >
              {slot}
            </div>
          );
        })}
      </div>
      <TapIndicator x={540} y={1120} startFrame={TAP_FRAME} />
    </div>
  );
};
