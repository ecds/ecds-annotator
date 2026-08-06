/* eslint-disable no-underscore-dangle */
import OpenSeadragon from "openseadragon";

const overlayOCR = async ({ viewer, items, ocrAdded }) => {
  const containerElement = document.createElement("div");
  viewer.canvas.appendChild(containerElement);

  for (const word of items) {
    containerElement.innerHTML += word.body[0].value;

    const location = word.target.selector.value
      .split(":")[1]
      .split(",")
      .map((i) => parseInt(i, 10));

    const el = document.getElementById(word.id.replace("#", ""));

    const box = new OpenSeadragon.Rect(
      location[0],
      location[1],
      location[2],
      location[3],
    );

    viewer.addOverlay({
      element: el,
      location: box,
      onDraw(position, size, element) {
        /*
          This is where all the magic happens.
          Overrides OpenSeadragon.Overlay's `onDraw` function to scale
          and rotate the OCR overlay elements. The majority is directly
          copied from https://github.com/openseadragon/openseadragon/blob/e72a60e5bc06d666c329508df3236061f9bbb406/src/overlay.js#L269-L295
          The only additions are to scale the font size and letter spacing
          of the overlay.
        */
        const { style } = element;
        style.left = `${parseInt(position.x, 10)}px`;
        style.top = `${parseInt(position.y, 10)}px`;
        style.fontSize = `${size.y / 1.6}px`;
        style.whiteSpace = "nowrap";

        /*
          When the Readux app creates the span elements for the OCR,
          it includes a `data-letter-spacing` attribute. This is a
          percentage of the initial calculated letter spacing of the
          overall width of the element.
        */
        const letterSpacing =
          parseFloat(element.getAttribute("data-letter-spacing")) * size.x;
        style.letterSpacing = `${letterSpacing}px`;

        if (this.width !== null) style.width = `${size.x}px`;
        if (this.height !== null) style.height = `${size.y}px`;

        const positionAndSize = this._getOverlayPositionAndSize(
          viewer.viewport,
        );
        const { rotate } = positionAndSize;

        const transformOriginProp =
          OpenSeadragon.getCssPropertyWithVendorPrefix("transformOrigin");
        const transformProp =
          OpenSeadragon.getCssPropertyWithVendorPrefix("transform");

        if (transformOriginProp && transformProp) {
          if (rotate) {
            style[transformOriginProp] = this._getTransformOrigin();
            style[transformProp] = `rotate(${rotate}deg)`;
          } else {
            style[transformOriginProp] = "";
            style[transformProp] = "";
          }
        }

        if (style.display !== "none") style.display = "block";
      },
    });
  }

  ocrAdded(true);
};

export default overlayOCR;
