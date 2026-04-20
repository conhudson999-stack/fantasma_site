import React from "react";
import { Img } from "remotion";
import { COLORS, FONTS } from "../brand";
import logo from "../assets/fantasma_logo_final.png";

interface BrowserFrameProps {
  children: React.ReactNode;
  url?: string;
}

/**
 * Wraps content in a browser window + site navigation,
 * making the video look like a screen recording of the actual site.
 */
export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  url = "fantasmafootball.com/booking",
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1a1a2e",
        padding: 32,
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          background: "#2d2d3d",
          borderRadius: "16px 16px 0 0",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#28c840" }} />
        </div>
        {/* URL bar */}
        <div
          style={{
            flex: 1,
            background: "#1a1a2e",
            borderRadius: 8,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Lock icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 16,
              color: "#aaa",
            }}
          >
            {url}
          </span>
        </div>
      </div>

      {/* Site content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "0 0 16px 16px",
          background: COLORS.cream,
          position: "relative",
        }}
      >
        {/* Site navigation — matches actual navbar */}
        <div
          style={{
            background: "rgba(248, 247, 244, 0.95)",
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
            flexShrink: 0,
          }}
        >
          {/* Logo */}
          <Img
            src={logo}
            style={{ height: 44, width: "auto", opacity: 0.9 }}
          />
          {/* Nav pill menu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              background: "rgba(10, 10, 10, 0.04)",
              border: "1px solid rgba(10, 10, 10, 0.06)",
              borderRadius: 9999,
              padding: 4,
            }}
          >
            {["About", "Programs", "Coaches", "FAQ", "Book a Session"].map((item) => (
              <span
                key={item}
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: item === "Book a Session" ? COLORS.navy : "rgba(4, 12, 20, 0.6)",
                  padding: "7px 14px",
                  borderRadius: 9999,
                  background: item === "Book a Session" ? "rgba(10, 10, 10, 0.06)" : "transparent",
                }}
              >
                {item}
              </span>
            ))}
          </div>
          {/* CTA */}
          <div
            style={{
              background: COLORS.navy,
              color: "#fff",
              fontFamily: FONTS.body,
              fontSize: 14,
              fontWeight: 600,
              padding: "9px 20px",
              borderRadius: 9999,
            }}
          >
            Back to Home
          </div>
        </div>

        {/* Page content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
