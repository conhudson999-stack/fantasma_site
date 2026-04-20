import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";

// Load fonts at module level — Remotion's google-fonts package handles
// delayRender/continueRender internally
const { fontFamily: bebasNeue } = loadBebasNeue();
const { fontFamily: outfit } = loadOutfit("normal", {
  weights: ["300", "400", "500", "600", "700"],
});

export const LOADED_FONTS = {
  display: bebasNeue,
  body: outfit,
} as const;

// No-op component kept for backward compatibility
export const FontLoader: React.FC = () => null;
