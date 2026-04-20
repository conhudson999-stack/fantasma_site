import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, random, AbsoluteFill } from "remotion";
import { COLORS } from "../brand";
import { LOADED_FONTS } from "../components/FontLoader";
import { GrainOverlay } from "../components/GrainOverlay";

const PARTICLE_COUNT = 30;

export const Confirmation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkScale = spring({ frame, fps, config: { damping: 8, stiffness: 120 } });
  const textIn = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 80 } });

  // Gold confetti particles — more varied sizes and trajectories
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const x = random(`x-${i}`) * 1080;
    const delay = random(`delay-${i}`) * 25;
    const speed = 4 + random(`speed-${i}`) * 5;
    const size = 6 + random(`size-${i}`) * 14;
    const relFrame = frame - 12 - delay;
    const y = relFrame > 0 ? relFrame * speed : -100;
    const rotation = relFrame * (random(`rot-${i}`) * 8 - 4);
    const drift = Math.sin(relFrame * 0.15 + random(`drift-${i}`) * 6) * 20;
    const opacity = interpolate(relFrame, [0, 8, 70], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    // Mix of gold and cream particles
    const isGold = random(`color-${i}`) > 0.3;

    return { x: x + drift, y, size, rotation, opacity, isGold };
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
      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size * (p.isGold ? 1 : 0.4),
            backgroundColor: p.isGold ? COLORS.gold : COLORS.cream,
            borderRadius: p.isGold ? 3 : 2,
            transform: `rotate(${p.rotation}deg)`,
            opacity: p.opacity,
          }}
        />
      ))}
      {/* Checkmark circle */}
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
          boxShadow: `0 0 60px ${COLORS.gold}40`,
        }}
      >
        <span style={{ fontSize: 80, color: COLORS.gold }}>✓</span>
      </div>
      {/* Text */}
      <p
        style={{
          fontFamily: LOADED_FONTS.display,
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
          fontFamily: LOADED_FONTS.body,
          fontSize: 32,
          color: `${COLORS.cream}90`,
          marginTop: 16,
          opacity: interpolate(frame, [40, 55], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        See you on the field
      </p>
    </AbsoluteFill>
  );
};
