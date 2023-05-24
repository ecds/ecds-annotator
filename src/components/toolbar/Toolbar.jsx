import React, { useContext, useEffect, useRef } from 'react';
import OpenSeadragon from 'openseadragon';
import {
  FaVectorSquare,
  FaDrawPolygon,
  FaICursor,
  FaMapMarker,
  FaRegCircle,
  FaComment,
  FaCommentSlash,
} from 'react-icons/fa';
import { MdGesture } from 'react-icons/md';
import { TfiLayoutGrid4Alt } from 'react-icons/tfi';
import Tooltip from '../tooltip/Tooltip';
import AdjustImage from './AdjustImage';
import { AppContext } from '../../ViewerContext';
import './Toolbar.scss';

const AnnotationTool = ({
  tooltipContent,
  active,
  disabled,
  onClick,
  children,
}) => (
  <Tooltip content={tooltipContent} className="flex items-center py-1 px-2 border-l-2 border-white w-max">
    <button
      type="button"
      className={`annotation-tool ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  </Tooltip>
);

const Toolbar = ({
  activeTool,
  annotorious,
  expandTools,
  ocrReady,
  setActiveTool,
  setShowAll,
  startAnnotation,
  toggleTools,
  viewer,
}) => {
  const containerRef = useRef();
  const { user } = useContext(AppContext);

  useEffect(() => {
    if (!viewer || !annotorious) return;

    const controlElements = viewer?.controls.map((control) => control.element);

    if (controlElements?.includes(containerRef.current)) return;

    const controlOptions = {
      anchor: OpenSeadragon.ControlAnchor.TOP_LEFT,
      autoFade: false,
    };

    viewer.addControl(containerRef.current, controlOptions);
  }, [viewer, annotorious]);

  const selectTool = (tool) => {
    startAnnotation(tool);
    setActiveTool(tool);
    if (tool !== 'text') {
      annotorious.setDrawingEnabled(true);
      annotorious.setDrawingTool(tool);
    }
  };

  return (
    <div ref={containerRef} className={`Toolbar ml-3 mt-2 w-16 flex flex-col ${ocrReady ? '' : 'not-ready'}`}>
      <Tooltip content="Show thumbnails of all pages.">
        <button type="button" onClick={setShowAll}>
          <TfiLayoutGrid4Alt />
        </button>
      </Tooltip>

      <AdjustImage />

      <Tooltip content={`${expandTools ? 'Hide' : 'Show'} annotations and tools`}>
        <button type="button" className="annotation-tool" onClick={toggleTools} disabled={!ocrReady}>
          {expandTools ? <FaCommentSlash /> : <FaComment />}
        </button>
      </Tooltip>

      {(expandTools && Boolean(user?.id))
        && (
          <>
            <AnnotationTool
              tooltipContent="Draw a rectangle to add annotation"
              active={activeTool === 'rect'}
              disabled={!ocrReady}
              onClick={() => selectTool('rect')}
            >
              <FaVectorSquare />
            </AnnotationTool>

            <AnnotationTool
              tooltipContent="Draw a polygon to add annotation"
              active={activeTool === 'polygon'}
              disabled={!ocrReady}
              onClick={() => selectTool('polygon')}
            >
              <FaDrawPolygon />
            </AnnotationTool>

            <AnnotationTool
              tooltipContent="Draw a circle to add annotation"
              active={activeTool === 'circle'}
              disabled={!ocrReady}
              onClick={() => selectTool('circle')}
            >
              <FaRegCircle />
            </AnnotationTool>

            <AnnotationTool
              tooltipContent="Freehand annotation"
              active={activeTool === 'freehand'}
              disabled={!ocrReady}
              onClick={() => selectTool('freehand')}
            >
              <MdGesture />
            </AnnotationTool>

            <AnnotationTool
              tooltipContent="Annotate a point"
              active={activeTool === 'point'}
              onClick={() => selectTool('point')}
              disabled={!ocrReady}
            >
              <FaMapMarker />
            </AnnotationTool>

            <AnnotationTool
              tooltipContent="Select text to annotate"
              active={activeTool === 'text'}
              disabled={!ocrReady}
              onClick={() => selectTool('text')}
            >
              <FaICursor />
            </AnnotationTool>
          </>
        )}
    </div>
  );
};

export default Toolbar;
