import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, random } from "remotion";
import { COLORS, FONTS } from "../brand";
import { GrainOverlay } from "../components/GrainOverlay";

const PARTICLE_COUNT = 24;

export const Confirmation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkScale = spring({ frame, fps, config: { damping: 8, stiffness: 120 } });
  const textIn = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 80 } });

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const x = random(`x-${i}`) * 1080;
    const delay = random(`delay-${i}`) * 30;
    const speed = 3 + random(`speed-${i}`) * 4;
    const size = 8 + random(`size-${i}`) * 12;
    const relFrame = frame - 15 - delay;
    const y = relFrame > 0 ? relFrame * speed : -100;
    const rotation = relFrame * (random(`rot-${i}`) * 6 - 3);
    const opacity = interpolate(relFrame, [0, 10, 80], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return { x, y, size, rotation, opacity };
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
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: COLORS.gold,
            borderRadius: 3,
            transform: `rotate(${p.rotation}deg)`,
            opacity: p.opacity,
          }}
        />
      ))}
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: `6px solid ${COLORS.gold}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${checkScale})`,
          marginBottom: 40,
        }}
      >
        <span style={{ fontSize: 80, color: COLORS.gold }}>✓</span>
      </div>
      <p
        style={{
          fontFamily: FONTS.display,
          fontSize: 72,
          color: COLORS.cream,
          opacity: textIn,
          transform: `translateY(${interpolate(textIn, [0, 1], [20, 0])}px)`,
        }}
      >
        YOU'RE BOOKED!
      </p>
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 32,
          color: `${COLORS.cream}90`,
          marginTop: 16,
          opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        See you on the field
      </p>
    </div>
  );
};
