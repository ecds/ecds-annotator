/* eslint-disable no-param-reassign */

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Editor } from "@recogito/recogito-client-core";
import TextAnnotation from "./TextAnnotation";
import BaseTextAnno from "./BaseTextAnnotation";
import EditorWidget from "../widgets/EditorWidget";
import TagWidget from "../widgets/TagWidget";

const TextAnnotations = ({
  annotations,
  annotorious,
  annotationServer,
  canvas,
  ocrReady,
  osdCanvas,
  isAnnotating,
  setStartNewTextAnnotation,
  setIsTextEditorOpen,
  setActiveTool,
  showAnnotations,
  startNewTextAnnotation,
  user,
  viewer,
}) => {
  const [textAnnotations, setTextAnnotations] = useState([]);
  const [selectedTextAnno, setSelectedTextAnno] = useState(undefined);
  const [selectedTextAnnoElement, setSelectedTextAnnoElement] =
    useState(undefined);
  const editorRef = useRef();
  const widgets = [EditorWidget, TagWidget];

  const selectTextAnno = (annotation, element) => {
    if (selectedTextAnno) return;
    setSelectedTextAnno(annotation);
    setSelectedTextAnnoElement(element);
    setIsTextEditorOpen(true);
  };

  const createTextAnnotation = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    if (
      selection.anchorOffset === selection.focusOffset &&
      selection.anchorNode === selection.focusNode
    )
      return;
    const range = selection.getRangeAt(0);
    document.removeEventListener("mouseup", createTextAnnotation);
    const baseTextAnno = BaseTextAnno({ user, canvas, range });
    setSelectedTextAnno(
      new TextAnnotation(baseTextAnno, viewer, selectTextAnno)
    );
    setSelectedTextAnnoElement(selection.focusNode.parentElement);
    setIsTextEditorOpen(true);
  };

  const saveNewTextAnnotation = async () => {
    const createdTextAnno = await annotationServer.create(
      selectedTextAnno.annotation
    );
    createdTextAnno.bodies = createdTextAnno.body;
    const newTextAnno = new TextAnnotation(createdTextAnno, viewer, selectTextAnno);
    await newTextAnno.addLinks();
    newTextAnno.addContentOverlays();
    newTextAnno.addEditOverlay();
    setSelectedTextAnno(undefined);
    setSelectedTextAnnoElement(undefined);
    setIsTextEditorOpen(false);
    setTextAnnotations((prev) => [...prev, newTextAnno]);
    viewer.setMouseNavEnabled(true);
    setActiveTool(undefined);
  };

  const updateTextAnnotation = async () => {
    const savedAnno = textAnnotations.includes(selectedTextAnno)
      ? await annotationServer.update(selectedTextAnno.annotation)
      : await annotationServer.create(selectedTextAnno.annotation);
    savedAnno.bodies = savedAnno.body;
    selectedTextAnno.updateAnnotation(savedAnno);
    setTextAnnotations([
      ...textAnnotations.filter((textAnno) => textAnno.id !== savedAnno.id),
      new TextAnnotation(selectedTextAnno.annotation, viewer, selectTextAnno),
    ]);
    setSelectedTextAnno(undefined);
    setSelectedTextAnnoElement(undefined);
    setIsTextEditorOpen(false);
    setStartNewTextAnnotation(false);
    viewer.setMouseNavEnabled(true);
    setActiveTool(undefined);
  };

  const onCancelAnnotation = () => {
    setSelectedTextAnno(undefined);
    setSelectedTextAnnoElement(undefined);
    setIsTextEditorOpen(false);
    setStartNewTextAnnotation(false);
    viewer.setMouseNavEnabled(true);
    setActiveTool(undefined);
  };

  const onDeleteAnnotation = async (annotation) => {
    onCancelAnnotation();
    await annotationServer.delete(annotation);
    if (annotation.target.selector.type === "RangeSelector") {
      const annoToDelete = textAnnotations.find(
        (textAnno) => textAnno.annotation.id === annotation.id
      );
      annoToDelete.removeLinks();
      setTextAnnotations(
        textAnnotations.filter((textAnno) => textAnno !== annoToDelete)
      );
    }
    viewer.setMouseNavEnabled(true);
    setActiveTool(undefined);
  };

  useEffect(() => {
    setTextAnnotations(
      annotations.map(
        (textAnno) => new TextAnnotation(textAnno, viewer, selectTextAnno)
      )
    );
  }, [annotations]);

  useEffect(() => {
    if (isAnnotating) {
      textAnnotations?.forEach((textAnno) => {
        textAnno.removeAnnotationOverlays();
      });
    } else {
      textAnnotations?.forEach((textAnno) => {
        textAnno.addContentOverlays();
        textAnno.addEditOverlay();
      });
    }
  }, [isAnnotating, textAnnotations]);

  /*
   * Remove/reload Text Annotations
   */
  useEffect(() => {
    if (!ocrReady) return;
    const addTextAnnos = async (textAnno) => {
      await textAnno.addLinks();
      textAnno.addContentOverlays();
      textAnno.addEditOverlay();
    };

    textAnnotations?.forEach((textAnno) => {
      textAnno.removeLinks();
      if (showAnnotations && ocrReady) addTextAnnos(textAnno);
    });
  }, [textAnnotations, showAnnotations, ocrReady]);

  useEffect(() => {
    if (startNewTextAnnotation && osdCanvas) {
      window.getSelection()?.removeAllRanges();
      viewer.setMouseNavEnabled(false);
      document.addEventListener("mouseup", createTextAnnotation);
    }
  }, [startNewTextAnnotation, osdCanvas]);

  return (
    <div>
      {selectedTextAnnoElement && selectedTextAnno &&
        ReactDOM.createPortal(
          <Editor
            ref={editorRef}
            detachable
            wrapperEl={viewer.element}
            annotation={selectedTextAnno.annotation}
            modifiedTarget={selectedTextAnno.annotation.target}
            selectedElement={selectedTextAnnoElement}
            readOnly={false}
            allowEmpty
            widgets={widgets}
            // eslint-disable-next-line no-underscore-dangle
            env={annotorious._env}
            onAnnotationCreated={saveNewTextAnnotation}
            onAnnotationUpdated={updateTextAnnotation}
            onAnnotationDeleted={onDeleteAnnotation}
            onCancel={onCancelAnnotation}
          />,
          viewer.element
        )
      }
    </div>
  );
};

export default TextAnnotations;
