import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";
import { TapIndicator } from "../components/TapIndicator";
import connorImg from "../assets/gcc_profile.webp";
import coltonImg from "../assets/colton_profile.webp";

export const ChooseCoach: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

  const selectFrame = 50;
  const isSelected = frame >= selectFrame;
  const ringSpring = isSelected
    ? spring({ frame: frame - selectFrame, fps, config: { damping: 10, stiffness: 150 } })
    : 0;

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
      {/* Label — matches .coach-selector-label */}
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 3,
          color: "rgba(4, 12, 20, 0.35)",
          textTransform: "uppercase",
          marginBottom: 48,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        SELECT YOUR COACH
      </p>
      {/* Coach bubbles */}
      <div
        style={{
          display: "flex",
          gap: 64,
          alignItems: "flex-start",
          opacity: fadeIn,
          transform: `translateY(${interpolate(fadeIn, [0, 1], [20, 0])}px)`,
        }}
      >
        {/* Connor */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "24px 40px",
            borderRadius: 20,
            background: isSelected ? "rgba(197, 179, 88, 0.06)" : "transparent",
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              overflow: "hidden",
              border: isSelected
                ? `3px solid ${COLORS.gold}`
                : "3px solid rgba(10, 10, 10, 0.08)",
              boxShadow: isSelected
                ? `0 0 0 ${6 * ringSpring}px rgba(197, 179, 88, 0.25)`
                : "none",
            }}
          >
            <Img src={connorImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 32,
              letterSpacing: 1.5,
              color: isSelected ? COLORS.gold : COLORS.navy,
            }}
          >
            CONNOR
          </span>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: 1,
              color: "rgba(4, 12, 20, 0.35)",
              textTransform: "uppercase",
            }}
          >
            Pittsburgh
          </span>
        </div>
        {/* Colton */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "24px 40px",
            borderRadius: 20,
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid rgba(10, 10, 10, 0.08)",
            }}
          >
            <Img src={coltonImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 32,
              letterSpacing: 1.5,
              color: COLORS.navy,
            }}
          >
            COLTON
          </span>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: 1,
              color: "rgba(4, 12, 20, 0.35)",
              textTransform: "uppercase",
            }}
          >
            Grove City / Slippery Rock
          </span>
        </div>
      </div>
      <TapIndicator x={370} y={880} startFrame={selectFrame} />
    </div>
  );
};
