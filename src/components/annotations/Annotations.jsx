import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import ViewerContext, { AppContext } from '../../ViewerContext';
import Toolbar from '../toolbar/Toolbar';
import OCR from './OCR';
import AnnotationServer from '../../utils/AnnotationServer';
import ShapeAnnotations from './ShapeAnnotations';
import TextAnnotations from './TextAnnotations';
import { getCanvasPid } from '../../utils/canvasUtils';
import './Annotations.scss';
import '@recogito/annotorious/dist/annotorious.min.css';
import 'jodit/build/jodit.es2018.min.css';

const Annotations = ({
  canvas, setShowAll, showAll,
}) => {
  const { viewer } = useContext(ViewerContext);
  const { user, token } = useContext(AppContext);
  const [anno, setAnno] = useState();
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [ocrReady, setOcrReady] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [shapeAnnotations, setShapeAnnotations] = useState([]);
  const [textAnnotations, setTextAnnotations] = useState([]);
  const [startNewTextAnnotation, setStartNewTextAnnotation] = useState(false);
  const osdCanvas = document.querySelector(`.${viewer.canvas.className} div`);
  const [activeTool, setActiveTool] = useState(undefined);

  const canvasEventDetails = useRef({
    annotationsOnPage: 0,
    canvas: showAll ? 'all' : getCanvasPid(canvas.id),
    annotationAdded: false,
    annotationDeleted: false,
  });

  const annotationServer = new AnnotationServer({ token });

  const startAnnotation = (tool) => {
    if (tool === 'text') {
      setStartNewTextAnnotation(true);
    } else {
      setIsAnnotating(true);
    }
  };

  /*
   * Get OCR and user annotations when a new canvas is loaded.
   */
  useEffect(() => {
    const onCanvasChange = async () => {
      // eslint-disable-next-line no-param-reassign
      viewer.overlaysContainer.style.display = 'initial';
      setShapeAnnotations([]);
      setTextAnnotations([]);
      const ocrPage = canvas.annotations.find((page) => page.id.endsWith('ocr'));
      const userPage = user.id
        ? canvas.annotations.find((page) => page.id.endsWith(user.id))
        : undefined;

      // TODO: Move this to Viewer after making it a func component
      viewer?.clearOverlays();

      const ocrAnnotations = await annotationServer.get(ocrPage.id);

      if (ocrAnnotations && ocrAnnotations.items.length === 0) {
        setOcrReady(true);
      } else {
        const ocr = new OCR({
          ocrAdded: setOcrReady,
          viewer,
          items: ocrAnnotations.items,
        });

        await ocr.overlayOCR();
      }

      const annotations = userPage?.id ? await annotationServer.get(userPage.id) : [];
      const shapeAnnos = annotations.items
        ? annotations.items.filter((shapeAnno) => shapeAnno.target.selector.type !== 'RangeSelector')
        : [];
      setShapeAnnotations(shapeAnnos);

      const textAnnos = annotations.items
        ? annotations.items.filter((textAnno) => textAnno.target.selector.type === 'RangeSelector')
        : [];
      setTextAnnotations(textAnnos);
    };

    setOcrReady(false);
    onCanvasChange();
    // dispatchCanvasSwitch();
  }, [canvas, setOcrReady, setShapeAnnotations, setTextAnnotations]);

  useEffect(() => {
    const userAnnotationCount = shapeAnnotations.length + textAnnotations.length;
    canvasEventDetails.current = {
      ...canvasEventDetails.current,
      annotationsOnPage: userAnnotationCount,
      canvas: getCanvasPid(canvas.id),
      annotationAdded: userAnnotationCount > canvasEventDetails.current.annotationsOnPage,
      annotationDeleted: userAnnotationCount < canvasEventDetails.current.annotationsOnPage,
    };
    const canvasEvent = new CustomEvent('canvasswitch', { bubbles: true, detail: canvasEventDetails.current });
    window.dispatchEvent(canvasEvent);
  }, [shapeAnnotations, textAnnotations, canvas]);

  return (
    <div>
      <Toolbar
        annotorious={anno}
        expandTools={showAnnotations}
        toggleTools={() => setShowAnnotations(!showAnnotations)}
        startAnnotation={startAnnotation}
        isAnnotating={isAnnotating}
        ocrReady={ocrReady}
        setShowAll={setShowAll}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />

      <ShapeAnnotations
        anno={anno}
        annotations={shapeAnnotations}
        annotationServer={annotationServer}
        canvas={canvas}
        setAnno={setAnno}
        setAnnotations={setShapeAnnotations}
        setIsAnnotating={setIsAnnotating}
        showAnnotations={showAnnotations}
        user={user}
        viewer={viewer}
      />

      <TextAnnotations
        annotations={textAnnotations}
        annotorious={anno}
        annotationServer={annotationServer}
        canvas={canvas}
        ocrReady={ocrReady}
        osdCanvas={osdCanvas}
        isAnnotating={isAnnotating}
        setStartNewTextAnnotation={setStartNewTextAnnotation}
        showAnnotations={showAnnotations}
        startNewTextAnnotation={startNewTextAnnotation}
        user={user}
        viewer={viewer}
      />
    </div>
  );
};

export default Annotations;
