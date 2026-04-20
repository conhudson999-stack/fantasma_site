import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Img, AbsoluteFill } from "remotion";
import { COLORS } from "../brand";
import { LOADED_FONTS } from "../components/FontLoader";
import { GrainOverlay } from "../components/GrainOverlay";
import logo from "../assets/fantasma_logo_final.png";

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const pulse = 1 + Math.sin(frame * 0.1) * 0.02;
  const ctaIn = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.navy,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <GrainOverlay />
      {/* Logo with pulse */}
      <div style={{ opacity: fadeIn, transform: `scale(${pulse})` }}>
        <Img src={logo} style={{ width: 240, height: 240, objectFit: "contain" }} />
      </div>
      {/* Handle */}
      <p
        style={{
          fontFamily: LOADED_FONTS.body,
          fontSize: 36,
          color: `${COLORS.cream}90`,
          opacity: fadeIn,
          marginTop: 24,
        }}
      >
        @fantasmafootball
      </p>
      {/* CTA */}
      <div
        style={{
          marginTop: 32,
          padding: "20px 60px",
          borderRadius: 12,
          border: `2px solid ${COLORS.gold}`,
          opacity: ctaIn,
          transform: `translateY(${interpolate(ctaIn, [0, 1], [10, 0])}px)`,
        }}
      >
        <p
          style={{
            fontFamily: LOADED_FONTS.display,
            fontSize: 36,
            color: COLORS.gold,
            letterSpacing: 1,
          }}
        >
          BOOK NOW AT FANTASMAFOOTBALL.COM
        </p>
      </div>
    </AbsoluteFill>
  );
};
