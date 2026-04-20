import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";
import logo from "../assets/fantasma_logo_final.png";

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const pulse = 1 + Math.sin(frame * 0.1) * 0.02;

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
        gap: 30,
      }}
    >
      <GrainOverlay />
      <div style={{ opacity: fadeIn, transform: `scale(${pulse})` }}>
        <Img src={logo} style={{ width: 240, height: 240, objectFit: "contain" }} />
      </div>
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 36,
          color: `${COLORS.cream}90`,
          opacity: fadeIn,
        }}
      >
        @fantasmafootball
      </p>
      <div
        style={{
          marginTop: 20,
          padding: "20px 60px",
          borderRadius: 12,
          border: `2px solid ${COLORS.gold}`,
          opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <p style={{ fontFamily: FONTS.display, fontSize: 36, color: COLORS.gold }}>
          BOOK NOW AT FANTASMAFOOTBALL.COM
        </p>
      </div>
    </div>
  );
};
