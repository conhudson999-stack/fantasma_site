import React from "react";
import { AbsoluteFill } from "remotion";

export const GrainOverlay: React.FC = () => (
  <AbsoluteFill
    style={{
      opacity: 0.03,
      pointerEvents: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "256px 256px",
      mixBlendMode: "overlay",
    }}
  />
);
