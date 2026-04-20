import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";

const FIELDS = [
  { label: "Full Name", value: "Alex Rivera", startFrame: 10 },
  { label: "Email", value: "alex@email.com", startFrame: 35 },
  { label: "Phone", value: "(412) 555-0123", startFrame: 60 },
];

export const FillDetails: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

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
          fontFamily: FONTS.display,
          fontSize: 48,
          color: COLORS.cream,
          marginBottom: 50,
          opacity: formIn,
        }}
      >
        YOUR DETAILS
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          width: "100%",
          maxWidth: 800,
          opacity: formIn,
        }}
      >
        {FIELDS.map(({ label, value, startFrame: sf }) => {
          const typingProgress = interpolate(frame - sf, [0, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const charsToShow = Math.floor(typingProgress * value.length);
          const showCheck = frame >= sf + 22;

          return (
            <div key={label}>
              <p
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 24,
                  color: `${COLORS.cream}80`,
                  marginBottom: 8,
                }}
              >
                {label}
              </p>
              <div
                style={{
                  padding: "24px 32px",
                  borderRadius: 12,
                  backgroundColor: `${COLORS.cream}08`,
                  border: `2px solid ${COLORS.cream}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 32,
                    color: COLORS.cream,
                  }}
                >
                  {value.slice(0, charsToShow)}
                  {charsToShow < value.length && (
                    <span style={{ opacity: frame % 10 < 5 ? 1 : 0 }}>|</span>
                  )}
                </span>
                {showCheck && (
                  <span style={{ color: COLORS.gold, fontSize: 28 }}>✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {frame >= 85 && (
        <div
          style={{
            marginTop: 50,
            padding: "24px 80px",
            borderRadius: 12,
            backgroundColor: COLORS.gold,
            fontFamily: FONTS.display,
            fontSize: 36,
            color: COLORS.navy,
            transform: `scale(${spring({ frame: frame - 85, fps, config: { damping: 10, stiffness: 150 } })})`,
          }}
        >
          BOOK SESSION
        </div>
      )}
    </div>
  );
};
