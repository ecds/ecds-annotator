import React from 'react';
import * as Annotorious from '@recogito/annotorious-openseadragon';
import SelectorPack from "@recogito/annotorious-selector-pack";
import BetterPolygon from '@recogito/annotorious-better-polygon';
import ShapeLabelsFormatter from '@recogito/annotorious-shape-labels';
import { Editor } from '@recogito/recogito-client-core';
import EditorWidget from './EditorWidget';
import LanguageWidget from './LanguageWidget';
import Toolbar from '../toolbar/Toolbar';
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
      isAnnotating: false,
      overlayElement: null
    };

    this._editor = React.createRef();
    this.onCreateOrUpdateAnnotation = this.onCreateOrUpdateAnnotation.bind(this);
    this.onDeleteAnnotation = this.onDeleteAnnotation.bind(this);
    this.onCancelAnnotation = this.onCancelAnnotation.bind(this);
    this.startAnnotation = this.startAnnotation.bind(this);
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
      this.state.overlayElement.style.display = 'initial';
    });

    annotorious.on('clickAnnotation', (annotation, element) => {
      // const overlay = new AnnotationContentOverlay(this.props.viewer, annotation);
      annotation.contentOverlay.hideAnnotation();
    });

    annotorious.on('mouseEnterAnnotation', (annotation, element) => {
      annotation.contentOverlay.showAnnotation(element);
    });

    annotorious.on('mouseLeaveAnnotation', (annotation, element) => {
      annotation.contentOverlay.hideAnnotation();
    });

    annotorious.on('startSelection', (selection) => {
      this.setState({ isAnnotating: true });
    });

    annotorious.on('cancelSelected', (selection) => {
      this.setState({
        isAnnotating: false,
        selectedTextAnno: this.__baseTextAnno(),
        selectedTextAnnoElement: null
      });

      this.state.overlayElement.style.display = 'initial';
    });

    this.getAnnotations();

    this.setState({ anno: annotorious });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !prevState.showAnnotations && this.state.showAnnotations ||
      !prevState.ocrReady && this.state.ocrReady && this.state.showAnnotations
    ) {
      this.addAnnotations();
    } else if (prevState.showAnnotations && !this.state.showAnnotations) {
      this.clearAnnotations();
    }

    if (prevProps.canvas !== this.props.canvas) {
      this.onCanvasChange();
    }

    if (
      !prevState.showAnnotations && this.state.showAnnotations &&
      prevState.userAnnotations.length === 0 &&
      this.state.userAnnotations.length > 0
    ) {
      this.addAnnotations();
    }

    this.dispatchCanvasSwitch();
  }

  async getAnnotations() {
    const userAnnotations = [];

    for (const annotationPage of this.props.canvas.annotations) {
      if (annotationPage.id.endsWith('ocr') && !this.state.ocrReady) {
        const ocrOptions = { url: annotationPage.id, viewer: this.props.viewer, ocrAdded: this.ocrAdded }
        const ocr = new OCR(ocrOptions);
        await ocr.overlayOCR();
      } else if (!annotationPage.id.endsWith('ocr')) {
        if (this.props.localEnv === 'dev') {
          for await (const annotation of data.items) {
            userAnnotations.push(annotation);
          }
        } else {
          const annotations = await this.annotationServer.get(annotationPage.id);
          for await (const annotation of annotations.items) {
            userAnnotations.push(annotation);
          }
        }
      }
    }

    if (userAnnotations.length > 0) {
      if (this.state.showAnnotations) {
        this.setState({ userAnnotations }, this.addAnnotations);
      } else {
        this.setState({ userAnnotations });
      }
    } else {
      this.setState({ userAnnotations: [] });
    }
  }

  async addAnnotations() {
    if (!this.state.showAnnotations) return;

    for (const annotation of this.state.userAnnotations) {
      annotation.contentOverlay = new AnnotationContentOverlay(this.props.viewer, annotation);
      switch (annotation.target.selector.type) {
        case 'SvgSelector':
        case 'FragmentSelector':
          this.state.anno.addAnnotation(annotation);
          break;
        case 'RangeSelector':
          const textAnnotation = new TextAnnotation(annotation, this.props.viewer);
          await textAnnotation.addLinks();
          textAnnotation.addContentOverlays();

          for (const link of textAnnotation.links) {
            this.__addAnnotationContentOverlay(link, annotation, true);

            this.__addClickToTextAnno(link, textAnnotation);
          }

          this.state.textAnnotations.push(textAnnotation);

          break;
      }
    }
  }

  async onCanvasChange() {
    this.clearAnnotations();
    this.props.viewer.clearOverlays();
    this.clearAnnotations();
    await this.setState(
      {
        userAnnotations: [],
        textAnnotations:[],
        ocrReady: false
      }
    );
    await this.getAnnotations();
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

  __addAnnotationContentOverlay(element, annotation, disableOSDMouse=false) {
    if (!element.parentNode) {
      setTimeout(() => {
        const dataId = element.getAttribute('data-id');
        element = document.querySelector(`[data-id="${dataId}"]`);
        this.__addAnnotationContentOverlay(element, annotation, disableOSDMouse);
      }, 300);
    } else {
    }
  }

  __addClickToTextAnno(element, textAnnotation) {
    if (!element.parentNode) {
      setTimeout(() => {
        setTimeout(() => {
          const dataId = element.getAttribute('data-id');
          element = document.querySelector(`[data-id="${dataId}"]`);
          this.__addClickToTextAnno(element, textAnnotation);
        }, 300);
      })
    } else {
      element.addEventListener('click', (event) => {
        if (!this.state.selectedTextAnnoElement) {
          this.setState({
            selectedTextAnno: textAnnotation,
            selectedTextAnnoElement: element
          });
        }
      }, false);
    }
  }

  clearAnnotations() {
    this.state.anno.clearAnnotations();
    this.state.textAnnotations.forEach(textAnno => textAnno.removeLinks());
    // this.setState({textAnnotations: [], userAnnotations: [] });
  }

  ocrAdded(overlayElement) {
    this.setState({
      ocrReady: true,
      overlayElement
    });
  }

  async onCreateOrUpdateAnnotation(annotation, arg) {
    annotation.body.forEach(body => {
      body.creator = this.props.user;
    });

    if (this.state.newTextAnnotation) {
      arg = 'create';
    }

    switch (arg) {
      case 'create':
        if (this.state.newTextAnnotation) {
          annotation.target.selector = this.state.newTextAnnotation;
          annotation.resource = annotation.body[0];
          this.setState({ newTextAnnotation: null });
          let textAnnotation = new TextAnnotation(annotation, this.props.viewer);
          await textAnnotation.addLinks();
          textAnnotation.addContentOverlays();
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
        await this.annotationServer.create(annotation);
        break;
      case 'update':
        delete annotation.contentOverlay;
        await this.annotationServer.update(annotation)
        if (annotation.target.selector.type == 'SvgSelector') {
          let svg_element = document.querySelector(`[data-id="#${annotation.id}"]`);
          // this.__addAnnotationContentOverlay(`[data-id="${annotation.id}"]`, annotation);
          // this.__addAnnotationContentOverlay(svg_element, annotation);
        } else {
          const links = document.querySelectorAll(`[data-id="#${annotation.id}"]`);

          for (const link of links) {
            this.__addAnnotationContentOverlay(link.parentNode, annotation, true);
          }
        }
        break
    }

    annotation.contentOverlay = new AnnotationContentOverlay(this.props.viewer, annotation);

    this.setState({
      isAnnotating: false,
      selectedTextAnno: this.__baseTextAnno(),
      selectedTextAnnoElement: null
    });
    this.state.overlayElement.style.display = 'initial';
  }

  onDeleteAnnotation(event) {
    this.setState({ selectedTextAnnoElement: null });
  }

  onCancelAnnotation(event) {
    this.setState({ selectedTextAnnoElement: null });
  }

  startAnnotation(tool) {
    if (tool === 'text') {
      this.props.viewer.setMouseNavEnabled(false);
      this.state.osdCanvas.style.zIndex = 999;
      this.state.osdCanvas.addEventListener('mouseup', this.createTextAnnotation);
    } else {
      this.state.overlayElement.style.display = 'none';
    }
  }

  async createTextAnnotation() {
    let selection = window.getSelection();
    if (!selection.rangeCount) return;
    if (selection.anchorOffset === selection.focusOffset && selection.anchorNode === selection.focusNode) return;
    const newTextAnnotation = new TextAnnotation(selection.getRangeAt(0));
    // await newTextAnnotation.addLinks();
    // newTextAnnotation.addContentOverlays();
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
          startAnnotation={this.startAnnotation}
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
