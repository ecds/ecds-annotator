/* eslint-disable react/prop-types */
import { useEffect } from 'react';
import * as Annotorious from '@recogito/annotorious-openseadragon';
import SelectorPack from '@recogito/annotorious-selector-pack';
import BetterPolygon from '@recogito/annotorious-better-polygon';
import EditorWidget from '../widgets/EditorWidget';
import AnnotationContentOverlay from './AnnotationContentOverlay';
import { getCanvasPid } from '../../utils/canvasUtils';

const widgets = [EditorWidget, 'TAG'];

const ShapeAnnotations = ({
  anno,
  annotations,
  annotationServer,
  canvas,
  setAnno,
  setAnnotations,
  setIsAnnotating,
  showAnnotations,
  // startNewTextAnnotation,
  user,
  viewer,
}) => {
  useEffect(() => {
    const annotorious = new Annotorious(viewer, {
      locale: 'auto',
      allowEmpty: true,
      widgets,
      disableEditor: user == null,
      readOnly: user == null,
    });

    setAnno(annotorious);

    // eslint-disable-next-line consistent-return
    return () => {
      anno?.destroy();
    };
  }, [setAnno, viewer]);

  /*
   * Setup Annotorious
   */
  useEffect(() => {
    if (!anno) return;

    const createShapeAnnotation = async (annotation) => {
      if (getCanvasPid(annotation.target.source) !== getCanvasPid(canvas.id)) return;
      const tmpAnnotation = annotation;

      tmpAnnotation.target.source = canvas.id;
      tmpAnnotation.body = [{ ...annotation.body[0], creator: user }];

      if (annotation.target.selector.type === 'SvgSelector') {
        const svgShape = document.querySelector(`.a9s-annotation[data-id="${annotation.id}"]`);
        const {
          x, y, width, height,
        } = svgShape.getBBox();
        tmpAnnotation.target.selector.refinedBy = {
          type: 'FragmentSelector',
          value: `xywh=${x},${y},${width},${height}`,
        };
      }

      const newAnnotation = await annotationServer.create(tmpAnnotation);
      newAnnotation.contentOverlay = new AnnotationContentOverlay(viewer, newAnnotation);
      anno.addAnnotation(newAnnotation);

      setIsAnnotating(false);

      setAnnotations(
        (shapeAnnos) => [...shapeAnnos, newAnnotation],
      );
    };

    const updateShapeAnnotation = async (annotation) => {
      anno.removeAnnotation(annotation);
      // Replace the annotation with updated annotation from API.
      const updatedAnnotation = annotation;
      // Remove overlay from payload before sending to API.
      delete updatedAnnotation.contentOverlay;
      await annotationServer.update(annotation);
      updatedAnnotation.contentOverlay = new AnnotationContentOverlay(viewer, updatedAnnotation);
      anno.addAnnotation(updatedAnnotation);

      setAnnotations(
        (shapeAnnos) => [
          ...shapeAnnos.filter((shapeAnno) => shapeAnno.id !== updatedAnnotation.id),
          updatedAnnotation,
        ],
      );

      setIsAnnotating(false);
    };

    const deleteAnnotation = async (annotation) => {
      await annotationServer.delete(annotation);
      setAnnotations(
        (shapeAnnos) => shapeAnnos.filter((shapeAnno) => shapeAnno.id !== annotation.id),
      );
    };

    anno.setAuthInfo(user);

    BetterPolygon(anno);

    SelectorPack(anno, { tools: ['circle', 'point', 'freehand'] });

    anno.off('createAnnotation');
    anno.off('updateAnnotation');
    anno.off('deleteAnnotation');
    anno.off('clickAnnotation');
    anno.off('mouseEnterAnnotation');
    anno.off('mouseLeaveAnnotation');
    anno.off('startSelection');
    anno.off('cancelSelected');

    anno.on('createAnnotation', createShapeAnnotation);
    anno.on('updateAnnotation', updateShapeAnnotation);
    anno.on('deleteAnnotation', deleteAnnotation);

    anno.on('clickAnnotation', (annotation /* , element */) => {
      // const overlay = new AnnotationContentOverlay(props.viewer, annotation);
      annotation.contentOverlay.hideAnnotation();
    });

    anno.on('mouseEnterAnnotation', (annotation, element) => {
      annotation.contentOverlay.showAnnotation(element);
    });

    anno.on('mouseLeaveAnnotation', (annotation /* , element */) => {
      annotation.contentOverlay.hideAnnotation();
    });

    anno.on('startSelection', (/* selection */) => {
      setIsAnnotating(true);
    });

    anno.on('cancelSelected', (/* selection */) => {
      setIsAnnotating(false);
    });
  }, [anno, setAnnotations, canvas]);

  /*
   * Remove/reload Shape Annotations
   */
  useEffect(() => {
    if (!anno) return;
    anno.clearAnnotations();
    annotations?.forEach((shapeAnno) => {
      if (showAnnotations) {
        // eslint-disable-next-line no-param-reassign
        shapeAnno.contentOverlay = new AnnotationContentOverlay(viewer, shapeAnno);
        anno.addAnnotation(shapeAnno);
      }
    });
  }, [annotations, showAnnotations, anno]);

  // useEffect(() => {
  //   if (startNewTextAnnotation) {
  //     anno.disableSelect = true;
  //     annotations?.forEach((shapeAnno) => {
  //       shapeAnno.contentOverlay = undefined;
  //     });
  //   } else {
  //     anno.disableSelect = true;
  //     annotations?.forEach((shapeAnno) => {
  //       shapeAnno.contentOverlay = new AnnotationContentOverlay(viewer, shapeAnno);
  //     });
  //   }
  // }, [startNewTextAnnotation]);

  return '';
};

export default ShapeAnnotations;
