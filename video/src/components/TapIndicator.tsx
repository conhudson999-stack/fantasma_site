import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS } from "../brand";

interface TapIndicatorProps {
  x: number;
  y: number;
  startFrame: number;
}

export const TapIndicator: React.FC<TapIndicatorProps> = ({ x, y, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0 || relativeFrame > 20) return null;

  const scale = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  const opacity = interpolate(relativeFrame, [0, 10, 20], [0, 0.8, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 60,
        height: 60,
        borderRadius: "50%",
        backgroundColor: COLORS.gold,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}
    />
  );
};
