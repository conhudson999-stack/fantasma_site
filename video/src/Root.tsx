import React from "react";
import { Composition, AbsoluteFill } from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { VIDEO, SCENE_FRAMES, TRANSITION_FRAMES } from "./brand";
import { LogoReveal } from "./sequences/LogoReveal";
import { ChooseCoach } from "./sequences/ChooseCoach";
import { PickDate } from "./sequences/PickDate";
import { SelectTime } from "./sequences/SelectTime";
import { FillDetails } from "./sequences/FillDetails";
import { Confirmation } from "./sequences/Confirmation";
import { EndCard } from "./sequences/EndCard";

// Import fonts at top level so they load before render
import "./components/FontLoader";

const BookingWalkthrough: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#040C14" }}>
      <TransitionSeries>
        {/* 1. Logo Reveal — fade into browser */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.logoReveal}>
          <LogoReveal />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* 2. Choose Coach */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.chooseCoach}>
          <ChooseCoach />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* 3. Pick Date */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.pickDate}>
          <PickDate />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* 4. Select Time */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.selectTime}>
          <SelectTime />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 14 } })}
        />

        {/* 5. Fill Details */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.fillDetails}>
          <FillDetails />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* 6. Confirmation */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.confirmation}>
          <Confirmation />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* 7. End Card */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.endCard}>
          <EndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BookingWalkthrough"
      component={BookingWalkthrough}
      durationInFrames={VIDEO.durationInFrames}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};
