import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { FONTS, COLORS } from "../brand";

interface TextCalloutProps {
  text: string;
  side: "left" | "right";
  enterFrame: number;
  exitFrame: number;
  y?: number;
}

export const TextCallout: React.FC<TextCalloutProps> = ({
  text,
  side,
  enterFrame,
  exitFrame,
  y = 960,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < enterFrame - 5 || frame > exitFrame + 15) return null;

  const enterProgress = spring({
    frame: frame - enterFrame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const exitProgress = frame >= exitFrame
    ? interpolate(frame - exitFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  const slideDistance = 80;
  const offsetX = side === "left"
    ? interpolate(enterProgress, [0, 1], [-slideDistance, 0]) - exitProgress * slideDistance
    : interpolate(enterProgress, [0, 1], [slideDistance, 0]) + exitProgress * slideDistance;

  const opacity = enterProgress * (1 - exitProgress);

  const xPos = side === "left" ? 30 : undefined;
  const rightPos = side === "right" ? 30 : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: xPos,
        right: rightPos,
        top: y,
        transform: `translateX(${offsetX}px) translateY(-50%)`,
        opacity,
        fontFamily: FONTS.display,
        fontSize: 36,
        letterSpacing: 2,
        color: COLORS.white,
        whiteSpace: "nowrap",
        textShadow: "0 2px 10px rgba(0,0,0,0.5)",
      }}
    >
      {text}
    </div>
  );
};
