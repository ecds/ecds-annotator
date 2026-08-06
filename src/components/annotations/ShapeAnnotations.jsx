/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import Annotorious from "@recogito/annotorious-openseadragon";
import SelectorPack from "@recogito/annotorious-selector-pack";
import BetterPolygon from "@recogito/annotorious-better-polygon";
import EditorWidget from "../widgets/EditorWidget";
import AnnotationContentOverlay from "./AnnotationContentOverlay";
import { getCanvasPid } from "../../utils/canvasUtils";

const widgets = [EditorWidget, "TAG"];

const ShapeAnnotations = ({
  anno,
  annotations,
  annotationServer,
  canvas,
  setAnno,
  setAnnotations,
  setIsAnnotating,
  showAnnotations,
  startNewTextAnnotation,
  isTextEditorOpen,
  activeTool,
  setActiveTool,
  user,
  viewer,
}) => {
  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    const annotorious = Annotorious(viewer, {
      locale: "auto",
      allowEmpty: true,
      widgets,
      disableEditor: user == null,
      readOnly: user == null,
    });

    setAnno(annotorious);

    // eslint-disable-next-line consistent-return
    return () => {
      annotorious.destroy();
    };
  }, [setAnno, viewer]);

  /*
   * Setup Annotorious
   */
  useEffect(() => {
    if (!anno) return;

    const createShapeAnnotation = async (annotation) => {
      if (getCanvasPid(annotation.target.source) !== getCanvasPid(canvas.id))
        return;
      const tmpAnnotation = annotation;

      tmpAnnotation.target.source = canvas.id;
      tmpAnnotation.body = [{ ...annotation.body[0], creator: user }];

      if (annotation.target.selector.type === "SvgSelector") {
        const svgShape = document.querySelector(
          `.a9s-annotation[data-id="${annotation.id}"]`
        );
        const { x, y, width, height } = svgShape.getBBox();
        tmpAnnotation.target.selector.refinedBy = {
          type: "FragmentSelector",
          value: `xywh=${x},${y},${width},${height}`,
        };
      }

      const newAnnotation = await annotationServer.create(tmpAnnotation);
      newAnnotation.contentOverlay = AnnotationContentOverlay(viewer, newAnnotation);
      anno.addAnnotation(newAnnotation);

      setIsAnnotating(false);
      anno.setDrawingEnabled(false);
      setActiveTool(undefined);

      setAnnotations((shapeAnnos) => [...shapeAnnos, newAnnotation]);
    };

    const updateShapeAnnotation = async (annotation) => {
      anno.removeAnnotation(annotation);
      // Replace the annotation with updated annotation from API.
      const updatedAnnotation = annotation;
      // Remove overlay from payload before sending to API.
      delete updatedAnnotation.contentOverlay;
      await annotationServer.update(annotation);
      updatedAnnotation.contentOverlay = AnnotationContentOverlay(viewer, updatedAnnotation);
      anno.addAnnotation(updatedAnnotation);

      setAnnotations((shapeAnnos) => [
        ...shapeAnnos.filter(
          (shapeAnno) => shapeAnno.id !== updatedAnnotation.id
        ),
        updatedAnnotation,
      ]);

      setIsAnnotating(false);
    };

    const cancelAnnotation = () => {
      anno.disableSelect = true;
      anno.cancelSelected();
      setIsAnnotating(false);
      setActiveTool(undefined);
    };

    const deleteAnnotation = async (annotation) => {
      await annotationServer.delete(annotation);
      setAnnotations((shapeAnnos) => shapeAnnos.filter((a) => a.id !== annotation.id));
      cancelAnnotation();
    };

    const clickAnnotation = (annotation) => {
      annotation.contentOverlay.hide();
    };

    const mouseEnterAnnotation = (annotation, element) => {
      if (activeToolRef.current) return;
      annotation.contentOverlay.show(element);
    };

    const mouseLeaveAnnotation = (annotation) => {
      annotation.contentOverlay.hide();
    };

    const startSelection = (/* selection */) => {
      setIsAnnotating(true);
    };

    anno.setAuthInfo(user);

    BetterPolygon(anno);

    SelectorPack(anno, { tools: ["circle", "point", "freehand"] });

    anno.off("createAnnotation");
    anno.off("updateAnnotation");
    anno.off("deleteAnnotation");
    anno.off("clickAnnotation");
    anno.off("mouseEnterAnnotation");
    anno.off("mouseLeaveAnnotation");
    anno.off("startSelection");
    anno.off("cancelSelected");

    anno.on("createAnnotation", createShapeAnnotation);
    anno.on("updateAnnotation", updateShapeAnnotation);
    anno.on("deleteAnnotation", deleteAnnotation);
    anno.on("clickAnnotation", clickAnnotation);
    anno.on("mouseEnterAnnotation", mouseEnterAnnotation);
    anno.on("mouseLeaveAnnotation", mouseLeaveAnnotation);
    anno.on("startSelection", startSelection);
    anno.on("cancelSelected", cancelAnnotation);

    return () => {
      anno.off("createAnnotation", createShapeAnnotation);
      anno.off("updateAnnotation", updateShapeAnnotation);
      anno.off("deleteAnnotation", deleteAnnotation);
      anno.off("clickAnnotation", clickAnnotation);
      anno.off("mouseEnterAnnotation", mouseEnterAnnotation);
      anno.off("mouseLeaveAnnotation", mouseLeaveAnnotation);
      anno.off("startSelection", startSelection);
      anno.off("cancelSelected", cancelAnnotation);
    };
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
        shapeAnno.contentOverlay = AnnotationContentOverlay(viewer, shapeAnno);
        anno.addAnnotation(shapeAnno);
      }
    });
  }, [annotations, showAnnotations, anno]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    if (!anno) return;
    anno.disableSelect = startNewTextAnnotation || isTextEditorOpen;
  }, [anno, startNewTextAnnotation, isTextEditorOpen]);

  return "";
};

export default ShapeAnnotations;
