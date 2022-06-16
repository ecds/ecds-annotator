import React from 'react';
import OpenSeadragon from 'openseadragon';
import * as Annotorious from '@recogito/annotorious-openseadragon';
import Annotations from '../annotations';

import './Viewer.scss';

class Viewer extends React.Component {
  constructor(props) {
    super(props);
    console.log("🚀 ~ file: Viewer.jsx ~ line 11 ~ Viewer ~ constructor ~ props", props)
    this.state = {
      viewer: null
    };

    this.addCanvas = this.addCanvas.bind(this);
  }

  componentDidMount() {
    let viewer = OpenSeadragon({
      id: "seadragon-viewer",
      prefixUrl: "//openseadragon.github.io/openseadragon/images/",
      showNavigationControl: false
    });

    this.setState({ viewer }, this.addCanvas);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.viewer && this.props.canvas && (this.props.canvas != prevProps.canvas)) {
      this.addCanvas();
    }
  }

  addCanvas() {
    let imageBounds = new OpenSeadragon.Rect(0, 0, this.props.canvas.width, this.props.canvas.height);
    this.state.viewer.viewport.fitBounds(imageBounds, true);
    console.log("🚀 ~ file: Viewer.jsx ~ line 38 ~ Viewer ~ addCanvas ~ this.state.viewer", this.state.viewer, this.state.viewer.world.getItemCount())
    const replaceOptions = {};
    if (this.state.viewer.world.getItemCount() > 0) {
      replaceOptions.replace = true;
      replaceOptions.index = 0;
    }
    this.state.viewer.addTiledImage({
      x: imageBounds.x,
      y: imageBounds.y,
      width: imageBounds.width,
      tileSource: {
        "@context": "http://iiif.io/api/image/2/context.json",
        "@id": this.props.canvas.images[0].resource.service['@id'],
        height: this.props.canvas.height,
        width: this.props.canvas.width,
        profile: ["http://iiif.io/api/image/2/level2.json"],
        protocol: "http://iiif.io/api/image"
      },
      ...replaceOptions
    });
  }

  render() {
    if (this.props.canvas) {
      return (
        <div className='Viewer' id="seadragon-viewer" data-testid="Viewer">

          {this.state.viewer &&
            <Annotations viewer={this.state.viewer} {...this.props} />
          }
        </div>
      )
    } else {
      return (
        <>
        </>
      )
    }
  }
}

export default Viewer;
