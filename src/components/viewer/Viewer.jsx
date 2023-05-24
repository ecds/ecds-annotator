import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import OpenSeadragon from 'openseadragon';
import ViewerContext from '../../ViewerContext';
import Annotations from '../annotations/Annotations';
import './Viewer.scss';

const Viewer = ({
  canvas, setShowAll, showAll,
}) => {
  const [viewer, setViewer] = useState();
  const viewerContainer = useRef();

  const contextValue = useMemo(() => (
    {
      viewer,
    }
  ), [viewer]);

  useEffect(() => {
    setViewer(
      OpenSeadragon({
        element: viewerContainer.current,
        prefixUrl: '//openseadragon.github.io/openseadragon/images/',
        showNavigationControl: false,
      }),
    );
  }, [setViewer, viewerContainer]);

  useEffect(() => {
    if (!viewer) return;

    const imageBounds = new OpenSeadragon.Rect(0, 0, canvas.width, canvas.height);
    viewer.viewport.fitBounds(imageBounds, true);
    const replaceOptions = {};

    if (viewer.world.getItemCount() > 0) {
      replaceOptions.replace = true;
      replaceOptions.index = 0;
    }

    viewer.addTiledImage({
      x: imageBounds.x,
      y: imageBounds.y,
      width: imageBounds.width,
      tileSource: {
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': canvas.items[0].body.id,
        height: canvas.height,
        width: canvas.width,
        profile: ['http://iiif.io/api/image/2/level2.json'],
        protocol: 'http://iiif.io/api/image',
      },
      ...replaceOptions,
    });
  }, [canvas, viewer]);

  if (canvas) {
    return (
      <ViewerContext.Provider value={contextValue}>
        <div className="Viewer" ref={viewerContainer}>
          {viewer && (
            <Annotations
              canvas={canvas}
              setShowAll={setShowAll}
              showAll={showAll}
            />
          )}
        </div>
      </ViewerContext.Provider>
    );
  }
  return '';
};

export default Viewer;
