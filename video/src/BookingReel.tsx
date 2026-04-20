import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { COLORS, FONTS, TIMING, SCROLL, PHONE } from "./brand";
import { PhoneMockup } from "./components/PhoneMockup";
import { BookingPage } from "./components/BookingPage";
import { Cursor } from "./components/Cursor";
import { TextCallout } from "./components/TextCallout";
import { GrainOverlay } from "./components/GrainOverlay";
import logo from "./assets/fantasma_logo_final.png";

export const BookingReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHONE ENTRANCE ===
  const phoneY = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
    from: 400,
    to: 0,
  });

  // === SCROLL POSITION ===
  const scrollY = (() => {
    if (frame < TIMING.scrollToCoach[0]) return SCROLL.hero;
    if (frame < TIMING.scrollToCalendar[0]) {
      const p = interpolate(frame, [...TIMING.scrollToCoach], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return interpolate(p, [0, 1], [SCROLL.hero, SCROLL.coach]);
    }
    if (frame < TIMING.scrollToSlots[0]) {
      const p = interpolate(frame, [...TIMING.scrollToCalendar], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return interpolate(p, [0, 1], [SCROLL.coach, SCROLL.calendar]);
    }
    if (frame < TIMING.scrollToForm[0]) {
      const p = interpolate(frame, [...TIMING.scrollToSlots], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return interpolate(p, [0, 1], [SCROLL.calendar, SCROLL.slots]);
    }
    if (frame < TIMING.confirmationStart) {
      const p = interpolate(frame, [...TIMING.scrollToForm], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return interpolate(p, [0, 1], [SCROLL.slots, SCROLL.form]);
    }
    return SCROLL.form;
  })();

  // === UI STATE ===
  const coachSelected = frame >= TIMING.coachClick;
  const selectedDay = frame >= TIMING.dateClick ? 15 : null;
  const selectedTime = frame >= TIMING.timeClick ? "5:00 PM" : null;

  // Form values (fast fill)
  const formValues = (() => {
    const f = frame - TIMING.formFillStart;
    if (f < 0) return { name: "", email: "", phone: "" };
    const name = "Alex Rivera".slice(0, Math.min(11, Math.floor(f * 1.5)));
    const email = f >= 7 ? "alex@email.com".slice(0, Math.min(14, Math.floor((f - 7) * 1.8))) : "";
    const phone = f >= 14 ? "(412) 555-0123".slice(0, Math.min(14, Math.floor((f - 14) * 2))) : "";
    return { name, email, phone };
  })();

  const showConfirmation = frame >= TIMING.confirmationStart;
  const confirmationOpacity = showConfirmation
    ? interpolate(frame - TIMING.confirmationStart, [0, 10], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  // === CURSOR TARGETS (relative to phone viewport, accounting for scroll) ===
  // These are where the elements appear in the viewport AFTER scrolling
  // Cursor targets: x,y are relative to phone content area (0,0 = top-left of content viewport)
  // The Cursor component adds phoneLeft and phoneTop offsets internally
  const cursorTargets = [
    { x: 400, y: 800, frame: TIMING.cursorAppear },           // initial idle position (center-ish)
    { x: 260, y: 200, frame: TIMING.coachClick, click: true }, // Connor's bubble center
    { x: 310, y: 500, frame: TIMING.dateClick, click: true },  // Day 15 cell
    { x: 460, y: 590, frame: TIMING.timeClick, click: true },  // 5:00 PM pill
    { x: 350, y: 770, frame: TIMING.bookClick, click: true },  // Book Session button
  ];

  // === END CARD (last 20 frames) ===
  const endCardOpacity = frame >= 430
    ? interpolate(frame, [430, 440], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.navy }}>
      {/* Phone with entrance animation */}
      <div style={{ transform: `translateY(${phoneY}px)` }}>
        <PhoneMockup>
          <BookingPage
            scrollY={scrollY}
            coachSelected={coachSelected}
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            formValues={formValues}
            showConfirmation={showConfirmation}
            confirmationOpacity={confirmationOpacity}
          />
        </PhoneMockup>
      </div>

      {/* Cursor */}
      <div style={{ transform: `translateY(${phoneY}px)` }}>
        <Cursor targets={cursorTargets} appearFrame={TIMING.cursorAppear} />
      </div>

      {/* Text callouts */}
      <TextCallout text="PICK YOUR COACH" side="left" enterFrame={80} exitFrame={135} y={750} />
      <TextCallout text="CHOOSE A DATE" side="right" enterFrame={170} exitFrame={235} y={850} />
      <TextCallout text="BOOK IN SECONDS" side="left" enterFrame={335} exitFrame={370} y={800} />

      {/* End card overlay */}
      {endCardOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: COLORS.navy,
            alignItems: "center",
            justifyContent: "center",
            opacity: endCardOpacity,
            gap: 12,
          }}
        >
          <Img src={logo} style={{ width: 120, height: 120, objectFit: "contain" }} />
          <p style={{ fontFamily: FONTS.body, fontSize: 24, color: `${COLORS.cream}90` }}>@fantasmafootball</p>
        </AbsoluteFill>
      )}

      {/* Grain overlay */}
      <GrainOverlay />
    </AbsoluteFill>
  );
};
