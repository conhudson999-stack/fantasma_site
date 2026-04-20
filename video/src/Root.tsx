import React from "react";
import { Composition } from "remotion";
import { VIDEO } from "./brand";
import { BookingReel } from "./BookingReel";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="BookingReel"
    component={BookingReel}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
