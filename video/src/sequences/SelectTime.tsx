import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";
import { BrowserFrame } from "../components/BrowserFrame";
import { TapIndicator } from "../components/TapIndicator";

const TIME_SLOTS = ["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];
const SELECTED_INDEX = 2;
const TAP_FRAME = 55;

export const SelectTime: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

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
        {/* Session type pills */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 24,
            opacity: panelIn,
          }}
        >
          <div
            style={{
              padding: "14px 36px",
              borderRadius: 9999,
              background: COLORS.gold,
              color: COLORS.navy,
              fontFamily: FONTS.body,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            1-on-1
          </div>
          <div
            style={{
              padding: "14px 36px",
              borderRadius: 9999,
              background: "#FFFFFF",
              border: "1px solid rgba(10, 10, 10, 0.08)",
              color: "rgba(4, 12, 20, 0.6)",
              fontFamily: FONTS.body,
              fontSize: 20,
              fontWeight: 500,
            }}
          >
            Small Group
          </div>
        </div>
        {/* Slots panel */}
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            background: "#FFFFFF",
            border: "1px solid rgba(10, 10, 10, 0.08)",
            borderRadius: 20,
            padding: 32,
            opacity: panelIn,
            transform: `translateY(${interpolate(panelIn, [0, 1], [20, 0])}px)`,
          }}
        >
          <p
            style={{
              fontFamily: FONTS.display,
              fontSize: 30,
              letterSpacing: 1,
              color: COLORS.navy,
              marginBottom: 4,
            }}
          >
            AVAILABLE TIMES
          </p>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: COLORS.gold,
              marginBottom: 22,
            }}
          >
            TUESDAY, APRIL 15
          </p>
          {/* 3-col pill grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
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
                    padding: "16px 12px",
                    borderRadius: 9999,
                    backgroundColor: isSelected ? COLORS.gold : "#FFFFFF",
                    border: `1px solid ${isSelected ? COLORS.gold : "rgba(10, 10, 10, 0.08)"}`,
                    fontFamily: FONTS.body,
                    fontSize: 22,
                    fontWeight: isSelected ? 600 : 500,
                    color: COLORS.navy,
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
        <TapIndicator x={490} y={950} startFrame={TAP_FRAME} />
      </div>
    </BrowserFrame>
  );
};
