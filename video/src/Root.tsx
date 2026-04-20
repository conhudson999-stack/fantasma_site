import React from "react";
import { Composition, Series } from "remotion";
import { VIDEO, SCENE_FRAMES } from "./brand";
import { FontLoader } from "./components/FontLoader";
import { LogoReveal } from "./sequences/LogoReveal";
import { ChooseCoach } from "./sequences/ChooseCoach";
import { PickDate } from "./sequences/PickDate";
import { SelectTime } from "./sequences/SelectTime";
import { FillDetails } from "./sequences/FillDetails";
import { Confirmation } from "./sequences/Confirmation";
import { EndCard } from "./sequences/EndCard";

const BookingWalkthrough: React.FC = () => {
  return (
    <div style={{ flex: 1, backgroundColor: "#040C14" }}>
      <FontLoader />
      <Series>
        <Series.Sequence durationInFrames={SCENE_FRAMES.logoReveal}>
          <LogoReveal />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_FRAMES.chooseCoach}>
          <ChooseCoach />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_FRAMES.pickDate}>
          <PickDate />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_FRAMES.selectTime}>
          <SelectTime />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_FRAMES.fillDetails}>
          <FillDetails />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_FRAMES.confirmation}>
          <Confirmation />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_FRAMES.endCard}>
          <EndCard />
        </Series.Sequence>
      </Series>
    </div>
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
