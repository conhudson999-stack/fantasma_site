import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";

const { fontFamily: bebasNeue } = loadBebasNeue();
const { fontFamily: outfit } = loadOutfit("normal", {
  weights: ["300", "400", "500", "600", "700"],
});

export const FONTS = {
  display: bebasNeue,
  body: outfit,
} as const;

export const COLORS = {
  navy: "#040C14",
  gold: "#C5B358",
  cream: "#F8F7F4",
  white: "#FFFFFF",
  border: "rgba(10, 10, 10, 0.08)",
  muted: "rgba(4, 12, 20, 0.35)",
  dim: "rgba(4, 12, 20, 0.6)",
} as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 450,
} as const;

export const PHONE = {
  width: 700,
  height: 1440,
  radius: 60,
  bezel: 12,
  notchWidth: 200,
  notchHeight: 34,
} as const;

export const TIMING = {
  phoneEnterEnd: 40,
  cursorAppear: 40,
  scrollToCoach: [60, 80] as const,
  coachClick: 110,
  scrollToCalendar: [140, 160] as const,
  dateClick: 200,
  scrollToSlots: [245, 260] as const,
  timeClick: 285,
  scrollToForm: [320, 340] as const,
  formFillStart: 345,
  bookClick: 370,
  confirmationStart: 390,
} as const;

export const SCROLL = {
  hero: 0,
  coach: 400,
  calendar: 800,
  slots: 1050,
  form: 1400,
} as const;
