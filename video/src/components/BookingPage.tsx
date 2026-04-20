import React from "react";
import { Img } from "remotion";
import { COLORS, FONTS, PHONE } from "../brand";
import logo from "../assets/fantasma_logo_final.png";
import connorImg from "../assets/gcc_profile.webp";
import coltonImg from "../assets/colton_profile.webp";

interface BookingPageProps {
  scrollY: number;
  coachSelected: boolean;
  selectedDay: number | null;
  selectedTime: string | null;
  formValues: { name: string; email: string; phone: string };
  showConfirmation: boolean;
  confirmationOpacity: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = ["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];

export const BookingPage: React.FC<BookingPageProps> = ({
  scrollY,
  coachSelected,
  selectedDay,
  selectedTime,
  formValues,
  showConfirmation,
  confirmationOpacity,
}) => {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Scrollable content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${-scrollY}px)`,
        }}
      >
        {/* === NAV BAR === */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(248, 247, 244, 0.95)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <Img src={logo} style={{ height: 32, width: "auto" }} />
          {/* Hamburger */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ width: 20, height: 2, background: COLORS.navy, borderRadius: 1 }} />
            <div style={{ width: 20, height: 2, background: COLORS.navy, borderRadius: 1 }} />
            <div style={{ width: 20, height: 2, background: COLORS.navy, borderRadius: 1 }} />
          </div>
        </div>

        {/* === HERO === */}
        <div style={{ padding: "60px 24px 40px", textAlign: "center" }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 13, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase", marginBottom: 8 }}>
            Schedule Training
          </p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 48, color: COLORS.navy, lineHeight: 1, margin: 0 }}>
            BOOK YOUR
          </h1>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 48, color: COLORS.gold, lineHeight: 1, margin: 0 }}>
            SESSION.
          </h1>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.dim, marginTop: 12 }}>
            Select a date, pick a time, and reserve your spot.
          </p>
        </div>

        {/* === COACH SELECTOR === */}
        <div style={{ padding: "0 24px 32px", textAlign: "center" }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: COLORS.muted, textTransform: "uppercase", marginBottom: 20 }}>
            SELECT YOUR COACH
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
            {/* Connor */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 16 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: coachSelected ? `3px solid ${COLORS.gold}` : `3px solid ${COLORS.border}`,
                  boxShadow: coachSelected ? `0 0 0 3px rgba(197, 179, 88, 0.25)` : "none",
                }}
              >
                <Img src={connorImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontFamily: FONTS.display, fontSize: 16, letterSpacing: 1, color: coachSelected ? COLORS.gold : COLORS.navy }}>
                CONNOR
              </span>
              <span style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                Pittsburgh
              </span>
            </div>
            {/* Colton */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: `3px solid ${COLORS.border}` }}>
                <Img src={coltonImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontFamily: FONTS.display, fontSize: 16, letterSpacing: 1, color: COLORS.navy }}>
                COLTON
              </span>
              <span style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                Grove City
              </span>
            </div>
          </div>
        </div>

        {/* === CALENDAR === */}
        <div style={{ padding: "0 20px 24px" }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: COLORS.navy }}>‹</div>
              <span style={{ fontFamily: FONTS.display, fontSize: 22, letterSpacing: 2, color: COLORS.navy }}>APRIL 2026</span>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: COLORS.navy }}>›</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "12px 16px 4px" }}>
              {WEEKDAYS.map((d) => (
                <div key={d} style={{ textAlign: "center", fontFamily: FONTS.body, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: COLORS.muted, textTransform: "uppercase" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 16px 16px", gap: 3 }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                const isSelected = day === selectedDay;
                const isPast = day < 10;
                return (
                  <div
                    key={day}
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? COLORS.navy : COLORS.navy,
                      backgroundColor: isSelected ? COLORS.gold : "transparent",
                      borderRadius: 8,
                      opacity: isPast ? 0.3 : 1,
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* === TIME SLOTS === */}
        <div style={{ padding: "0 20px 24px" }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20 }}>
            <p style={{ fontFamily: FONTS.display, fontSize: 18, letterSpacing: 1, color: COLORS.navy, marginBottom: 4 }}>AVAILABLE TIMES</p>
            <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, letterSpacing: 2, color: COLORS.gold, marginBottom: 14, textTransform: "uppercase" }}>TUESDAY, APRIL 15</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = slot === selectedTime;
                return (
                  <div
                    key={slot}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 9999,
                      backgroundColor: isSelected ? COLORS.gold : COLORS.white,
                      border: `1px solid ${isSelected ? COLORS.gold : COLORS.border}`,
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 500,
                      color: COLORS.navy,
                      textAlign: "center",
                    }}
                  >
                    {slot}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* === FORM === */}
        <div style={{ padding: "0 20px 40px" }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20 }}>
            <p style={{ fontFamily: FONTS.display, fontSize: 18, letterSpacing: 1, color: COLORS.navy, marginBottom: 16 }}>YOUR DETAILS</p>
            {[
              { label: "Full Name", value: formValues.name },
              { label: "Email Address", value: formValues.email },
              { label: "Phone Number", value: formValues.phone },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <p style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 500, color: COLORS.navy, marginBottom: 6 }}>{label}</p>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${value ? COLORS.gold : COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    color: value ? COLORS.navy : COLORS.muted,
                    minHeight: 38,
                  }}
                >
                  {value || ""}
                </div>
              </div>
            ))}
            <div
              style={{
                marginTop: 8,
                padding: "14px 24px",
                borderRadius: 10,
                backgroundColor: COLORS.gold,
                fontFamily: FONTS.display,
                fontSize: 18,
                letterSpacing: 1,
                color: COLORS.navy,
                textAlign: "center",
              }}
            >
              BOOK SESSION
            </div>
          </div>
        </div>
      </div>

      {/* === CONFIRMATION OVERLAY === */}
      {showConfirmation && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: COLORS.navy,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: confirmationOpacity,
            gap: 16,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: `4px solid ${COLORS.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 40, color: COLORS.gold }}>✓</span>
          </div>
          <p style={{ fontFamily: FONTS.display, fontSize: 36, color: COLORS.cream }}>
            YOU'RE BOOKED!
          </p>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: `${COLORS.cream}90` }}>
            See you on the field
          </p>
        </div>
      )}
    </div>
  );
};
