import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";
import { BrowserFrame } from "../components/BrowserFrame";

const FIELDS = [
  { label: "Full Name", value: "Alex Rivera", startFrame: 10 },
  { label: "Email Address", value: "alex@email.com", startFrame: 35 },
  { label: "Phone Number", value: "(412) 555-0123", startFrame: 60 },
];

export const FillDetails: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

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
        {/* Form card */}
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            background: "#FFFFFF",
            border: "1px solid rgba(10, 10, 10, 0.08)",
            borderRadius: 20,
            padding: 36,
            opacity: formIn,
            transform: `translateY(${interpolate(formIn, [0, 1], [20, 0])}px)`,
          }}
        >
          <p
            style={{
              fontFamily: FONTS.display,
              fontSize: 30,
              letterSpacing: 1,
              color: COLORS.navy,
              marginBottom: 28,
            }}
          >
            YOUR DETAILS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
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
                      fontSize: 18,
                      fontWeight: 500,
                      color: COLORS.navy,
                      marginBottom: 8,
                    }}
                  >
                    {label}
                  </p>
                  <div
                    style={{
                      padding: "16px 22px",
                      borderRadius: 12,
                      backgroundColor: "#FFFFFF",
                      border: `1px solid ${charsToShow > 0 ? COLORS.gold : "rgba(10, 10, 10, 0.08)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 22,
                        color: charsToShow > 0 ? COLORS.navy : "rgba(4, 12, 20, 0.35)",
                      }}
                    >
                      {charsToShow > 0 ? value.slice(0, charsToShow) : ""}
                      {charsToShow > 0 && charsToShow < value.length && (
                        <span style={{ opacity: frame % 10 < 5 ? 1 : 0, color: COLORS.gold }}>|</span>
                      )}
                    </span>
                    {showCheck && (
                      <span style={{ color: COLORS.gold, fontSize: 20 }}>✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {frame >= 85 && (
            <div
              style={{
                marginTop: 28,
                padding: "16px 48px",
                borderRadius: 12,
                backgroundColor: COLORS.gold,
                fontFamily: FONTS.display,
                fontSize: 26,
                letterSpacing: 1,
                color: COLORS.navy,
                textAlign: "center",
                transform: `scale(${spring({ frame: frame - 85, fps, config: { damping: 10, stiffness: 150 } })})`,
              }}
            >
              BOOK SESSION
            </div>
          )}
        </div>
      </div>
    </BrowserFrame>
  );
};
