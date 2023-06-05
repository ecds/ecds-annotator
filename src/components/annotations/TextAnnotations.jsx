/* eslint-disable no-param-reassign */

import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@recogito/recogito-client-core';
import TextAnnotation from './TextAnnotation';
import BaseTextAnno from './BaseTextAnnotation';
import EditorWidget from '../widgets/EditorWidget';
import TagWidget from '../widgets/TagWidget';

const TextAnnotations = ({
  annotations,
  annotorious,
  annotationServer,
  canvas,
  ocrReady,
  osdCanvas,
  isAnnotating,
  setStartNewTextAnnotation,
  setActiveTool,
  showAnnotations,
  startNewTextAnnotation,
  user,
  viewer,

}) => {
  const [textAnnotations, setTextAnnotations] = useState([]);
  const [selectedTextAnno, setSelectedTextAnno] = useState(undefined);
  const [selectedTextAnnoElement, setSelectedTextAnnoElement] = useState(undefined);
  const editorRef = useRef();
  const widgets = [EditorWidget, TagWidget];

  const selectTextAnno = (annotation, element) => {
    setSelectedTextAnno(annotation);
    setSelectedTextAnnoElement(element);
  };

  const createTextAnnotation = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    if (
      selection.anchorOffset === selection.focusOffset
      && selection.anchorNode === selection.focusNode
    ) return;
    const range = selection.getRangeAt(0);
    osdCanvas.removeEventListener('mouseup', createTextAnnotation);
    // eslint-disable-next-line no-param-reassign
    osdCanvas.style.zIndex = '';
    const baseTextAnno = BaseTextAnno({ user, canvas, range });
    setSelectedTextAnno(new TextAnnotation(baseTextAnno, viewer, selectTextAnno));
    setSelectedTextAnnoElement(selection.focusNode.parentElement);
  };

  const saveNewTextAnnotation = async () => {
    const createdTextAnno = await annotationServer.create(selectedTextAnno.annotation);
    createdTextAnno.bodies = createdTextAnno.body;
    setSelectedTextAnno(undefined);
    setSelectedTextAnnoElement(undefined);
    setTextAnnotations([...textAnnotations, createTextAnnotation]);
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
    setStartNewTextAnnotation(false);
    viewer.setMouseNavEnabled(true);
    setActiveTool(undefined);
  };

  const onCancelAnnotation = () => {
    setSelectedTextAnno(undefined);
    setSelectedTextAnnoElement(undefined);
    setStartNewTextAnnotation(false);
    viewer.setMouseNavEnabled(true);
    setActiveTool(undefined);
  };

  const onDeleteAnnotation = async (annotation) => {
    onCancelAnnotation();
    await annotationServer.delete(annotation);
    if (annotation.target.selector.type === 'RangeSelector') {
      const annoToDelete = textAnnotations.find(
        (textAnno) => textAnno.annotation.id === annotation.id,
      );
      annoToDelete.removeLinks();
      setTextAnnotations(
        textAnnotations.filter((textAnno) => textAnno !== annoToDelete),
      );
    }
    viewer.setMouseNavEnabled(true);
    setActiveTool(undefined);
  };

  useEffect(() => {
    setTextAnnotations(annotations.map(
      (textAnno) => new TextAnnotation(textAnno, viewer, selectTextAnno),
    ));
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
    if (startNewTextAnnotation) {
      viewer.setMouseNavEnabled(false);
      osdCanvas.style.zIndex = 999;
      osdCanvas.addEventListener('mouseup', createTextAnnotation);
    }
  }, [startNewTextAnnotation]);

  return (
    <div>
      {(selectedTextAnnoElement && selectedTextAnno) && (
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
        />
      )}
    </div>
  );
};

export default TextAnnotations;
