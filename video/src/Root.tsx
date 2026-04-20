import React from "react";
import { Composition, Series, useCurrentFrame } from "remotion";
import { VIDEO, SCENE_FRAMES, TRANSITION_FRAMES } from "./brand";
import { FontLoader } from "./components/FontLoader";
import { DiagonalWipe } from "./components/DiagonalWipe";
import { LogoReveal } from "./sequences/LogoReveal";
import { ChooseCoach } from "./sequences/ChooseCoach";
import { PickDate } from "./sequences/PickDate";
import { SelectTime } from "./sequences/SelectTime";
import { FillDetails } from "./sequences/FillDetails";
import { Confirmation } from "./sequences/Confirmation";
import { EndCard } from "./sequences/EndCard";

const BookingWalkthrough: React.FC = () => {
  const frame = useCurrentFrame();

  const sceneBoundaries = [
    SCENE_FRAMES.logoReveal,
    SCENE_FRAMES.logoReveal + SCENE_FRAMES.chooseCoach,
    SCENE_FRAMES.logoReveal + SCENE_FRAMES.chooseCoach + SCENE_FRAMES.pickDate,
    SCENE_FRAMES.logoReveal + SCENE_FRAMES.chooseCoach + SCENE_FRAMES.pickDate + SCENE_FRAMES.selectTime,
    SCENE_FRAMES.logoReveal + SCENE_FRAMES.chooseCoach + SCENE_FRAMES.pickDate + SCENE_FRAMES.selectTime + SCENE_FRAMES.fillDetails,
    SCENE_FRAMES.logoReveal + SCENE_FRAMES.chooseCoach + SCENE_FRAMES.pickDate + SCENE_FRAMES.selectTime + SCENE_FRAMES.fillDetails + SCENE_FRAMES.confirmation,
  ];

  return (
    <div style={{ flex: 1, backgroundColor: "#040C14", position: "relative" }}>
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
      {sceneBoundaries.map((boundary, i) => (
        <DiagonalWipe key={i} startFrame={boundary - TRANSITION_FRAMES / 2} />
      ))}
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
