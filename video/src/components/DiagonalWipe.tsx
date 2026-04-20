import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, TRANSITION_FRAMES } from "../brand";

interface DiagonalWipeProps {
  startFrame: number;
}

export const DiagonalWipe: React.FC<DiagonalWipeProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0 || relativeFrame > TRANSITION_FRAMES) return null;

  const progress = interpolate(relativeFrame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Diagonal wipe from top-left to bottom-right
  const translateX = interpolate(progress, [0, 1], [-100, 100]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: COLORS.gold,
        transform: `translateX(${translateX}%) skewX(-45deg)`,
        transformOrigin: "center",
        zIndex: 100,
      }}
    />
  );
};
