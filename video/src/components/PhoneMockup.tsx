import React from "react";
import { AbsoluteFill } from "remotion";
import { PHONE, COLORS, FONTS } from "../brand";

interface PhoneMockupProps {
  children: React.ReactNode;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ children }) => {
  const left = (1080 - PHONE.width) / 2;
  const top = (1920 - PHONE.height) / 2;

  return (
    <AbsoluteFill>
      {/* Phone shadow */}
      <div
        style={{
          position: "absolute",
          left: left - 4,
          top: top - 4,
          width: PHONE.width + 8,
          height: PHONE.height + 8,
          borderRadius: PHONE.radius + 4,
          boxShadow: "0 20px 80px rgba(0,0,0,0.6), 0 8px 30px rgba(0,0,0,0.4)",
        }}
      />
      {/* Phone bezel */}
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: PHONE.width,
          height: PHONE.height,
          borderRadius: PHONE.radius,
          background: "#1a1a1a",
          border: "2px solid #333",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Status bar */}
        <div
          style={{
            height: 54,
            background: COLORS.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <span style={{ fontFamily: FONTS.body, fontSize: 15, fontWeight: 600, color: COLORS.navy }}>
            9:41
          </span>
          {/* Dynamic Island */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 10,
              transform: "translateX(-50%)",
              width: PHONE.notchWidth,
              height: PHONE.notchHeight,
              borderRadius: 20,
              background: "#1a1a1a",
            }}
          />
          {/* Battery/signal */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <svg width="16" height="12" viewBox="0 0 16 12">
              <rect x="0" y="8" width="3" height="4" fill={COLORS.navy} rx="0.5" />
              <rect x="4" y="5" width="3" height="7" fill={COLORS.navy} rx="0.5" />
              <rect x="8" y="2" width="3" height="10" fill={COLORS.navy} rx="0.5" />
              <rect x="12" y="0" width="3" height="12" fill={COLORS.navy} rx="0.5" />
            </svg>
            <svg width="24" height="12" viewBox="0 0 24 12">
              <rect x="0" y="1" width="20" height="10" rx="2" fill="none" stroke={COLORS.navy} strokeWidth="1.5" />
              <rect x="2" y="3" width="15" height="6" rx="1" fill={COLORS.navy} />
              <rect x="21" y="3.5" width="2" height="5" rx="1" fill={COLORS.navy} />
            </svg>
          </div>
        </div>
        {/* Content viewport */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative", background: COLORS.cream }}>
          {children}
        </div>
        {/* Home indicator */}
        <div style={{ height: 28, background: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 140, height: 5, borderRadius: 3, background: COLORS.navy, opacity: 0.2 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
