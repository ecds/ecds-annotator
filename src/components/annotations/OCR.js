import OpenSeadragon from 'openseadragon';
import AnnotationServer from '../../utils/AnnotationServer';

class OCR {
  constructor(props) {
    this.props = props;
    this.ocrOverlays = [];
    this.ocrAnnotations = null;
    this.containerElement = document.createElement('div');
    this.props.viewer.canvas.appendChild(this.containerElement);
  }

  async overlayOCR() {
    await this.fetchOCR();

    let el = null;

    await this.ocrAnnotations.forEach((word) => {
      let location = word.target.selector.value
        .split(":")[1]
        .split(",")
        .map(function (i) {
          return parseInt(i);
        });

      el = document.getElementById(word['id'].replace('#', ''));

      //           el.addEventListener("mouseover", () => {
      //             // alert("hello");
      //             this.props.viewer.setMouseNavEnabled(false);
      //             this.props.viewer.gestureSettingsMouse.clickToZoom = false;
      //             this.props.viewer.mouseNavEnabled = false;
      //             this.props.viewer.panVertical = false;
      //             this.props.viewer.panHorizontal = false;
      //           });

      //           el.addEventListener("mouseup", () => {
      //             // alert(window.getSelection().toString())
      //             this.props.viewer.setMouseNavEnabled(true);
      //             this.props.viewer.gestureSettingsMouse.clickToZoom = true;
      //             this.props.viewer.mouseNavEnabled = true;
      //             this.props.viewer.panVertical = true;
      //             this.props.viewer.panHorizontal = true;
      //           });

      let box = new OpenSeadragon.Rect(
        location[0],
        location[1],
        location[2],
        location[3]
      );

      let viewer = this.props.viewer;
      let ocrOverlay = {
        element: el,
        location: box,
        onDraw: function (position, size, element) {
          /*
            This is where all the magic happens.
            Overrides OpenSeadragon.Overlay"s `onDraw` function to scale
            and rotate the OCR overlay elements. The majority is directly
            copied from https://github.com/openseadragon/openseadragon/blob/e72a60e5bc06d666c329508df3236061f9bbb406/src/overlay.js#L269-L295
            The only additions are to scale the font size and letter spacing
            of the overlay.
          */

          let style = element.style;
          style.left = `${parseInt(position.x)}px`;
          style.top = `${parseInt(position.y)}px`;
          style.fontSize = `${size.y / 1.6}px`;
          style.whiteSpace = 'nowrap';

          /*
            When the Readux app creates the span elements for the OCR,
            it includes a `data-letter-spacing` attribute. This is a
            percentage of the initial calculated letter spacing of the
            overall width of the element.

          */

          const letterSpacing = parseFloat(element.getAttribute("data-letter-spacing")) * size.x;
          style.letterSpacing = `${letterSpacing}px`;

          if (this.width !== null) {
            style.width = `${size.x}px`;
          }

          if (this.height !== null) {
            style.height = `${size.y}px`;
          }

          let positionAndSize = this._getOverlayPositionAndSize(
            viewer.viewport
          );

          let rotate = positionAndSize.rotate;

          let transformOriginProp =
            OpenSeadragon.getCssPropertyWithVendorPrefix(
              "transformOrigin"
            );

          let transformProp = OpenSeadragon.getCssPropertyWithVendorPrefix("transform");

          if (transformOriginProp && transformProp) {
            if (rotate) {
              style[transformOriginProp] = this._getTransformOrigin();
              style[transformProp] = "rotate(" + rotate + "deg)";
            } else {
              style[transformOriginProp] = "";
              style[transformProp] = "";
            }
          }

          if (style.display !== "none") {
            style.display = "block";
          }
        },
      };
      this.props.viewer.addOverlay(ocrOverlay);
      this.ocrOverlays.push(ocrOverlay);
    });

    // if (el?.parentElement) this.props.ocrAdded(el.parentElement);
    this.props.ocrAdded();
  }

  async fetchOCR() {
    const annotationServer = new AnnotationServer();
    const data = await annotationServer.get(this.props.url);

    this.ocrAnnotations = data.items;

    if (data.items.length === 0) this.props.ocrAdded();

    await data.items.forEach((item) => {
      this.containerElement.innerHTML += item.body[0].value;
    });
  }
}

export default OCR;
