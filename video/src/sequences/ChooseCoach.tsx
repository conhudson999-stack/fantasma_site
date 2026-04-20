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

  const slideConnor = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const slideColton = spring({ frame: frame - 5, fps, config: { damping: 14, stiffness: 100 } });

  const selectFrame = 50;
  const ringScale = frame >= selectFrame
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
        backgroundColor: COLORS.navy,
        position: "relative",
        gap: 40,
      }}
    >
      <GrainOverlay />
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 36,
          color: COLORS.cream,
          letterSpacing: 4,
          textTransform: "uppercase",
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Select Your Coach
      </p>
      <div style={{ display: "flex", gap: 80, alignItems: "center" }}>
        {/* Connor */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `translateX(${interpolate(slideConnor, [0, 1], [-200, 0])}px)`,
            opacity: slideConnor,
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              overflow: "hidden",
              border: `4px solid ${ringScale > 0 ? COLORS.gold : COLORS.cream}40`,
              boxShadow: ringScale > 0 ? `0 0 30px ${COLORS.gold}60` : "none",
              transform: `scale(${1 + ringScale * 0.08})`,
            }}
          >
            <Img src={connorImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: FONTS.body, fontSize: 28, color: COLORS.cream, marginTop: 16 }}>
            Connor
          </span>
        </div>
        {/* Colton */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `translateX(${interpolate(slideColton, [0, 1], [200, 0])}px)`,
            opacity: slideColton,
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              overflow: "hidden",
              border: `4px solid ${COLORS.cream}40`,
            }}
          >
            <Img src={coltonImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: FONTS.body, fontSize: 28, color: COLORS.cream, marginTop: 16 }}>
            Colton
          </span>
        </div>
      </div>
      <TapIndicator x={340} y={960} startFrame={selectFrame} />
    </div>
  );
};
