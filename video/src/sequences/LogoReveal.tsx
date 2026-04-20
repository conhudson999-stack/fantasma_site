import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";
import logo from "../assets/fantasma_logo_final.png";

export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const shimmerX = interpolate(frame, [30, 70], [-100, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        overflow: "hidden",
      }}
    >
      <GrainOverlay />
      <div style={{ opacity: fadeIn, transform: `scale(${0.8 + fadeIn * 0.2})` }}>
        <Img
          src={logo}
          style={{ width: 320, height: 320, objectFit: "contain" }}
        />
      </div>
      {/* Gold shimmer sweep */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 400,
          height: 400,
          transform: `translate(-50%, -50%)`,
          background: `linear-gradient(90deg, transparent 0%, ${COLORS.gold}40 50%, transparent 100%)`,
          marginLeft: shimmerX,
          opacity: interpolate(frame, [30, 50, 70], [0, 0.6, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
