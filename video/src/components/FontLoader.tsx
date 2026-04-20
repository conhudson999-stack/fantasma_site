import { useEffect } from "react";
import { continueRender, delayRender } from "remotion";

export const FontLoader: React.FC = () => {
  useEffect(() => {
    const handle = delayRender("Loading fonts");

    const bebasNeue = new FontFace(
      "Bebas Neue",
      "url(https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9Wlhyw.woff2)"
    );
    const outfit = new FontFace(
      "Outfit",
      "url(https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1O4a0Ew.woff2)"
    );

    Promise.all([bebasNeue.load(), outfit.load()])
      .then((fonts) => {
        fonts.forEach((f) => document.fonts.add(f));
        continueRender(handle);
      })
      .catch(() => {
        continueRender(handle);
      });
  }, []);

  return null;
};
