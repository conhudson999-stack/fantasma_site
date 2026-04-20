import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { makeTransform, translateX, translateY, scale } from "@remotion/animation-utils";
import { PHONE } from "../brand";

interface CursorTarget {
  x: number;
  y: number;
  frame: number;
  click?: boolean;
}

interface CursorProps {
  targets: CursorTarget[];
  appearFrame: number;
}

export const Cursor: React.FC<CursorProps> = ({ targets, appearFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < appearFrame) return null;

  // Find current target
  let currentTarget = targets[0];
  for (let i = targets.length - 1; i >= 0; i--) {
    if (frame >= targets[i].frame - 15) {
      currentTarget = targets[i];
      break;
    }
  }

  const phoneLeft = (1080 - PHONE.width) / 2;
  const phoneTop = (1920 - PHONE.height) / 2 + 54;

  let cursorX = phoneLeft + currentTarget.x;
  let cursorY = phoneTop + currentTarget.y;

  // Spring toward target
  const progress = spring({
    frame: frame - (currentTarget.frame - 15),
    fps,
    config: { damping: 20, mass: 1, stiffness: 120 },
  });

  // Interpolate from previous target
  const targetIdx = targets.indexOf(currentTarget);
  if (targetIdx > 0) {
    const prev = targets[targetIdx - 1];
    const prevX = phoneLeft + prev.x;
    const prevY = phoneTop + prev.y;
    cursorX = interpolate(progress, [0, 1], [prevX, phoneLeft + currentTarget.x]);
    cursorY = interpolate(progress, [0, 1], [prevY, phoneTop + currentTarget.y]);
  }

  // Click animation
  let clickScale = 1;
  if (currentTarget.click && frame >= currentTarget.frame && frame <= currentTarget.frame + 8) {
    const clickProgress = (frame - currentTarget.frame) / 8;
    clickScale = clickProgress < 0.4 ? interpolate(clickProgress, [0, 0.4], [1, 0.7]) : interpolate(clickProgress, [0.4, 1], [0.7, 1]);
  }

  // Fade in
  const opacity = interpolate(frame - appearFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: cursorX,
        top: cursorY,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        transform: makeTransform([translateX(-10), translateY(-10), scale(clickScale)]),
        opacity,
        zIndex: 1000,
      }}
    />
  );
};
