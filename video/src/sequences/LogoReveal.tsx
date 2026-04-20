import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Img, AbsoluteFill } from "remotion";
import { COLORS } from "../brand";
import { LOADED_FONTS } from "../components/FontLoader";
import { GrainOverlay } from "../components/GrainOverlay";
import logo from "../assets/fantasma_logo_final.png";

export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const shimmerX = interpolate(frame, [30, 70], [-200, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline fade in
  const taglineOpacity = interpolate(frame, [50, 70], [0, 1], {
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
      {/* Logo */}
      <div style={{ opacity: fadeIn, transform: `scale(${0.8 + fadeIn * 0.2})` }}>
        <Img
          src={logo}
          style={{ width: 320, height: 320, objectFit: "contain" }}
        />
      </div>
      {/* Tagline */}
      <p
        style={{
          fontFamily: LOADED_FONTS.display,
          fontSize: 42,
          color: COLORS.gold,
          letterSpacing: 3,
          marginTop: 24,
          opacity: taglineOpacity,
          transform: `translateY(${interpolate(taglineOpacity, [0, 1], [10, 0])}px)`,
        }}
      >
        FEAR THE PHANTOM. TRAIN FANTASMA.
      </p>
      {/* Gold shimmer sweep */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 500,
          height: 500,
          transform: `translate(-50%, -50%)`,
          background: `linear-gradient(90deg, transparent 0%, ${COLORS.gold}30 50%, transparent 100%)`,
          marginLeft: shimmerX,
          opacity: interpolate(frame, [30, 50, 70], [0, 0.5, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
