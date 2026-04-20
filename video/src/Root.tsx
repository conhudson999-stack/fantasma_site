import { Composition } from "remotion";
import { VIDEO } from "./brand";

const Placeholder: React.FC = () => (
  <div style={{ flex: 1, backgroundColor: "#040C14" }} />
);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BookingWalkthrough"
      component={Placeholder}
      durationInFrames={VIDEO.durationInFrames}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};
