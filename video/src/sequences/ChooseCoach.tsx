import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { COLORS } from "../brand";
import { LOADED_FONTS } from "../components/FontLoader";
import { GrainOverlay } from "../components/GrainOverlay";
import { BrowserFrame } from "../components/BrowserFrame";
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
    <BrowserFrame>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: 40,
        }}
      >
        <GrainOverlay />
        <p
          style={{
            fontFamily: LOADED_FONTS.body,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 3,
            color: "rgba(4, 12, 20, 0.35)",
            textTransform: "uppercase",
            marginBottom: 36,
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          SELECT YOUR COACH
        </p>
        <div
          style={{
            display: "flex",
            gap: 48,
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
              gap: 10,
              padding: "20px 32px",
              borderRadius: 20,
              background: isSelected ? "rgba(197, 179, 88, 0.06)" : "transparent",
            }}
          >
            <div
              style={{
                width: 130,
                height: 130,
                borderRadius: "50%",
                overflow: "hidden",
                border: isSelected
                  ? `3px solid ${COLORS.gold}`
                  : "3px solid rgba(10, 10, 10, 0.08)",
                boxShadow: isSelected
                  ? `0 0 0 ${5 * ringSpring}px rgba(197, 179, 88, 0.25)`
                  : "none",
              }}
            >
              <Img src={connorImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span
              style={{
                fontFamily: LOADED_FONTS.display,
                fontSize: 26,
                letterSpacing: 1.5,
                color: isSelected ? COLORS.gold : COLORS.navy,
              }}
            >
              CONNOR
            </span>
            <span
              style={{
                fontFamily: LOADED_FONTS.body,
                fontSize: 14,
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
              gap: 10,
              padding: "20px 32px",
              borderRadius: 20,
            }}
          >
            <div
              style={{
                width: 130,
                height: 130,
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid rgba(10, 10, 10, 0.08)",
              }}
            >
              <Img src={coltonImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span
              style={{
                fontFamily: LOADED_FONTS.display,
                fontSize: 26,
                letterSpacing: 1.5,
                color: COLORS.navy,
              }}
            >
              COLTON
            </span>
            <span
              style={{
                fontFamily: LOADED_FONTS.body,
                fontSize: 14,
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
        <TapIndicator x={350} y={750} startFrame={selectFrame} />
      </div>
    </BrowserFrame>
  );
};
