import React from 'react';
// import Annotorious from '@recogito/annotorious-openseadragon/src';
import * as Annotorious from '@recogito/annotorious-openseadragon';
import SelectorPack from "@recogito/annotorious-selector-pack";
import BetterPolygon from '@recogito/annotorious-better-polygon';
import ShapeLabelsFormatter from '@recogito/annotorious-shape-labels';
import { Editor } from '@recogito/recogito-client-core';
// import JoditEditorWidget from 'annotorious-jodit-widget/src';
import EditorWidget from '../EditorWidget';
import Toolbar from '../toolbar/Toolbar';
// import OCR from '../ocr/OCR';
import OCR from './OCR';

import data from '../../annotations';

import TextAnnotation from './TextAnnotation';
import AnnotationContentOverlay from './AnnotationContentOverlay';
import { UUID } from '../../utils/UUID';
import AnnotationServer from '../../utils/AnnotationServer';

import './Annotations.scss';
import '@recogito/annotorious/dist/annotorious.min.css';
import 'jodit/build/jodit.es2018.min.css';

class Annotations extends React.Component {
  constructor(props) {
    super(props);

    this.annotationServer = new AnnotationServer({ token: this.props.token });

    this.canvasEvent = new CustomEvent('canvasswitch', { bubbles: true, detail: {} });

    this.state = {
      anno: null,
      selectedTextAnnoElement: null,
      newTextAnnotation: null,
      selectedTextAnno: this.__baseTextAnno(),
      widgets: [EditorWidget, 'TAG'],
      osdCanvas: document.querySelector(`.${this.props.viewer.canvas.className} div`),
      showAnnotations: false,
      userAnnotations: [],
      textAnnotations: [],
      ocrReady: false,
      isAnnotating: false
    };

    this._editor = React.createRef();
    this.onCreateOrUpdateAnnotation = this.onCreateOrUpdateAnnotation.bind(this);
    this.onDeleteAnnotation = this.onDeleteAnnotation.bind(this);
    this.onCancelAnnotation = this.onCancelAnnotation.bind(this);
    this.startTextAnnotation = this.startTextAnnotation.bind(this);
    this.createTextAnnotation = this.createTextAnnotation.bind(this);
    this.toggleAnnotations = this.toggleAnnotations.bind(this);
    this.addAnnotations = this.addAnnotations.bind(this);
    this.clearAnnotations = this.clearAnnotations.bind(this);
    this.onCanvasChange = this.onCanvasChange.bind(this);
    this.ocrAdded = this.ocrAdded.bind(this);
    this.getAnnotations = this.getAnnotations.bind(this);
    this.dispatchCanvasSwitch = this.dispatchCanvasSwitch.bind(this);
    this.__baseTextAnno = this.__baseTextAnno.bind(this);
  }

  componentDidMount() {
    // if (this.props.viewer && !this.state.anno) {
    const annotorious = new Annotorious(this.props.viewer, {
      locale: "auto",
      allowEmpty: true,
      widgets: this.state.widgets,
      disableEditor: this.props.user == null,
      readOnly: this.props.user == null
    });

    annotorious.setAuthInfo(this.props.user);

    BetterPolygon(annotorious);

    SelectorPack(annotorious, { tools: [ 'circle', 'point', 'freehand' ]});

    annotorious.on('createAnnotation', annotation => {
      this.onCreateOrUpdateAnnotation(annotation, 'create');
    });

    annotorious.on('updateAnnotation', (annotation, previous) => {
      this.onCreateOrUpdateAnnotation(annotation, 'update');
    });

    annotorious.on('deleteAnnotation', annotation => {
      this.annotationServer.delete(annotation);
      this.setState({
        isAnnotating: false,
        selectedTextAnno: this.__baseTextAnno(),
        selectedTextAnnoElement: null
      });
    });

    // annotorious.on('clickAnnotation', (annotation, element) => {
    //
    // });

    annotorious.on('startSelection', (selection) => {
      this.setState({ isAnnotating: true });
    });

    annotorious.on('cancelSelected', (selection) => {
      this.setState({
        isAnnotating: false,
        selectedTextAnno: this.__baseTextAnno(),
        selectedTextAnnoElement: null
      });

      switch (selection.target.selector.type) {
        case 'SvgSelector':
          this.__addAnnotationContentOverlay(document.querySelector(`[data-id="${selection.id}"]`), selection);
          break;
        case 'RangeSelector':
          //
          break;
      }

    });


    // annotorious.on('selectAnnotation', (annotation, element) => {

    // });

    this.getAnnotations();

    this.setState({ anno: annotorious });
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("🚀 ~ file: index.jsx ~ line 165 ~ Annotations ~ componentDidUpdate ~ this.state", this.state.selectedTextAnno, prevState.selectedTextAnno)
    console.log("🚀 ~ file: index.jsx ~ line 165 ~ Annotations ~ componentDidUpdate ~ this.state", this.state.selectedTextAnnoElement, prevState.selectedTextAnnoElement)
    if (!prevState.showAnnotations && this.state.showAnnotations || !prevState.ocrReady && this.state.ocrReady && this.state.showAnnotations) {
      console.log("🚀 ~ file: index.jsx ~ line 172 ~ Adding Annotations", this)
      this.addAnnotations();
    } else if (prevState.showAnnotations && !this.state.showAnnotations) {
      console.log("🚀 ~ file: index.jsx ~ line 172 ~ Clearing Annotations", this)
      this.clearAnnotations();
    }

    if (prevProps.canvas !== this.props.canvas) {
      this.onCanvasChange();
    }

    this.dispatchCanvasSwitch();
  }

  async getAnnotations() {
    const userAnnotations = [];

    for (const annotationPage of this.props.canvas.annotations) {
      if (annotationPage.id.endsWith('ocr')) {
        new OCR({ url: annotationPage.id, viewer: this.props.viewer, ocrAdded: this.ocrAdded });
      } else {
        if (this.props.localEnv === 'dev') {
          for (const annotation of data.items) {
            userAnnotations.push(annotation);
          }
        } else {
          const annotations = await this.annotationServer.get(annotationPage.id);
          for (const annotation of annotations.items) {
            userAnnotations.push(annotation);
          }
        }
      }
    }

    if (userAnnotations.length > 0) {
      this.setState({ userAnnotations });
    } else {
      this.setState({ userAnnotations: [] });
    }
  }

  onCanvasChange() {
    this.clearAnnotations();
    this.props.viewer.clearOverlays();
    this.getAnnotations();
  }

  dispatchCanvasSwitch(details={}) {
    const eventDetails = {
      annotationsOnPage: this.state.userAnnotations.length,
      canvas: this.getCanvasPid(this.props.canvas.id),
      annotationAdded: false,
      annotationDeleted: false,
      ...details
    }
    for (const [key, value] of Object.entries(eventDetails)) {
      this.canvasEvent.detail[key] = value;
    }
    window.dispatchEvent(this.canvasEvent);
  }

  getCanvasPid(uri) {
    const parts = uri.split('/').reverse();

    if (parts[0] === 'canvas') {
      return parts[1];
    }

    return parts[0];
  }


  toggleAnnotations() {
    this.setState({ showAnnotations: !this.state.showAnnotations });
  }

  async addAnnotations() {
    console.log("🚀 ~ file: index.jsx ~ line 248 ~ Annotations ~ addAnnotations ~ this.stat", this.stat)
    if (this.state.userAnnotations.length === 0) {
      await this.getAnnotations();
    }

    for (const annotation of this.state.userAnnotations) {
      switch (annotation.target.selector.type) {
        case 'SvgSelector':
        case 'FragmentSelector':
          this.state.anno.addAnnotation(annotation);
          this.__addAnnotationContentOverlay(document.querySelector(`[data-id="${annotation.id}"]`), annotation);
          break;
        case 'RangeSelector':
          const textAnnotation = new TextAnnotation(annotation, this.props.viewer);
          for (const link of textAnnotation.links) {

            this.__addAnnotationContentOverlay(link.parentNode, annotation, true);

            // link.parentNode.addEventListener('mouseleave', () => {
            //   this.props.viewer.setMouseNavEnabled(true);
            //   textAnnotation.hideAnnotation();
            // });

            link.parentNode.addEventListener('click', () => {
              if (!this.state.selectedTextAnnoElement) {
                this.setState({
                  selectedTextAnno: textAnnotation,
                  selectedTextAnnoElement: link
                });
              }
            }, false);
          }

          this.state.textAnnotations.push(textAnnotation);

          break;
      }
    }
  }

  __addAnnotationContentOverlay(element, annotation, disableOSDMouse=false) {
    const overlay = new AnnotationContentOverlay(this.props.viewer, annotation);
    element.onmouseenter = (event) => {
      overlay.showAnnotation(event);
      if (disableOSDMouse) {
        this.props.viewer.setMouseNavEnabled(false);
      }
    };

    element.onmouseleave = (event) => {
      overlay.hideAnnotation();
      if (disableOSDMouse) {
        this.props.viewer.setMouseNavEnabled(true);
      }
    }
  }

  clearAnnotations() {
    this.state.anno.clearAnnotations();
    this.state.textAnnotations.forEach(textAnno => textAnno.removeLinks());
    this.setState({ocrReady: false, textAnnotations: [], userAnnotations: [] });
  }

  ocrAdded() {
    this.setState({ ocrReady: true });
  }

  onCreateOrUpdateAnnotation(annotation, arg) {
    console.log("🚀 ~ file: index.jsx ~ line 281 ~ Annotations ~ onCreateOrUpdateAnnotation ~ annotation, arg", annotation, arg)
    annotation.body.forEach(body => {
      body.creator = this.props.user;
    });

    // if (this.state.newTextAnnotation) {
    //   arg = 'create';
    // }
    console.log("🚀 ~ file: index.jsx ~ line 287 ~ Annotations ~ onCreateOrUpdateAnnotation ~ this.state.newTextAnnotation", this.state.newTextAnnotation)

    switch (arg) {
      case 'update':
        if (this.state.newTextAnnotation) {
          annotation.target.selector = this.state.newTextAnnotation;
          annotation.resource = annotation.body[0];
          this.setState({ newTextAnnotation: null });
          let textAnnotation = new TextAnnotation(annotation);
          this.state.textAnnotations.push(textAnnotation);
        } else {
          annotation.target.source = this.props.canvas.id
          if (annotation.target.selector.type == 'SvgSelector') {
            const svgShape = document.querySelector(`.a9s-annotation[data-id="${annotation.id}"]`);
            const { x, y, width, height } = svgShape.getBBox();
            annotation.target.selector.refinedBy = {
              type: 'FragmentSelector',
              value: `xywh=${x},${y},${width},${height}`
            };
          }
        }
        this.annotationServer.create(annotation);
        break;
      case 'create':
        this.annotationServer.update(annotation).then(() => {
          if (annotation.target.selector.type == 'SvgSelector') {
            let svg_element = document.querySelector(`[data-id="#${annotation.id}"]`);
            // this.__addAnnotationContentOverlay(`[data-id="${annotation.id}"]`, annotation);
            this.__addAnnotationContentOverlay(svg_element, annotation);
          } else {
            const links = document.querySelectorAll(`[data-id="#${annotation.id}"]`);

            for (const link of links) {
              this.__addAnnotationContentOverlay(link.parentNode, annotation, true);
            }
          }
        });
        break
    }

    this.setState({
      isAnnotating: false,
      selectedTextAnno: this.__baseTextAnno(),
      selectedTextAnnoElement: null
    });
  }

  onDeleteAnnotation(event) {
    this.setState({ selectedTextAnnoElement: null });
  }

  onCancelAnnotation(event) {
    this.setState({ selectedTextAnnoElement: null });
  }

  startTextAnnotation() {
    this.props.viewer.setMouseNavEnabled(false);
    this.state.osdCanvas.style.zIndex = 999;
    this.state.osdCanvas.addEventListener('mouseup', this.createTextAnnotation);
  }

  createTextAnnotation() {
    console.log("🚀 ~ file: index.jsx ~ line 376 ~ Annotations ~ createTextAnnotation ~ this.state", this.state.selectedTextAnno)
    let selection = window.getSelection();
    if (!selection.rangeCount) return;
    if (selection.anchorOffset === selection.focusOffset && selection.anchorNode === selection.focusNode) return;
    const newTextAnnotation = new TextAnnotation(selection.getRangeAt(0));
    this.state.osdCanvas.removeEventListener('mouseup', this.createTextAnnotation);
    this.state.osdCanvas.style.zIndex = '';
    this.setState(
      {
        selectedTextAnnoElement: selection.focusNode.parentElement,
        newTextAnnotation
      }
    );
  }

  render() {
    return (
      <div>
        {/* {this.props.canvas &&
          <OCR ocrAdded={this.ocrAdded} {...this.props} />
        } */}

        <Toolbar
          annotorious={this.state.anno}
          expandTools={this.state.showAnnotations}
          toggleTools={this.toggleAnnotations}
          startTextAnnotation={this.startTextAnnotation}
          isAnnotating={this.state.isAnnotating}
          ocrReady={this.state.ocrReady}
          {...this.props} />

        {(this.state.selectedTextAnnoElement) &&
          <Editor
            ref={this._editor}
            detachable
            wrapperEl={this.props.viewer.element}
            annotation={ this.state.selectedTextAnno.annotation }
            modifiedTarget={ this.state.selectedTextAnno.annotation.target }
            selectedElement={this.state.selectedTextAnnoElement}
            readOnly={false}
            allowEmpty={true}
            widgets={ this.state.widgets }
            env={this.state.anno._env}
            onAnnotationCreated={(event) => this.onCreateOrUpdateAnnotation(event, 'create')}
            onAnnotationUpdated={(event) => this.onCreateOrUpdateAnnotation(event, 'update')}
            onAnnotationDeleted={this.onDeleteAnnotation}
            onCancel={this.onCancelAnnotation} />
        }
      </div>
    )
  }

  __baseTextAnno(annotation={}) {
    let baseAnno = {
      type: "Annotation",
      isEqual: function() { return true },
      body: [
        {
          type: "TextualBody",
          value: "",
          purpose: "commenting",
          creator: this.props.user
        }
      ],
      bodies: [
        {
          type: "TextualBody",
          value: "",
          purpose: "commenting",
          creator: this.props.user
        }
      ],
      target: {
        type: "RangeSelector",
        source: this.props.canvas.id,
        selector: {}
      },
      "@context": "http://www.w3.org/ns/anno.jsonld",
      id: UUID(),
      ...annotation
    };

    baseAnno.clone = function() { return baseAnno };

    return { annotation: baseAnno };
  }
}

export default Annotations;
