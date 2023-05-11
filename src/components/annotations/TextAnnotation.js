/* eslint-disable no-param-reassign */
import OpenSeadragon from 'openseadragon';
import { UUID } from '../../utils/UUID';
import AnnotationContentOverlay from './AnnotationContentOverlay';

class TextAnnotation {
  constructor(annotation, viewer, selectedTextAnno) {
    this.annotation = annotation;
    this.annotation.clone = () => annotation;
    this.annotation.isEqual = () => true;
    this.annotation.bodies = annotation.body;
    this.viewer = viewer;
    this.selectedTextAnno = selectedTextAnno;

    this.annotationOverlay = null;

    const { selector } = annotation.target;

    this.id = annotation.id || UUID();

    this.start = document.evaluate(
      selector.startSelector.value,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;

    this.end = document.evaluate(
      selector.endSelector.value,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;

    this.range = this.getRange();

    this.startOffset = selector.startSelector.refinedBy.start;
    this.endOffset = selector.endSelector.refinedBy.end;

    this.links = [];
  }

  updateAnnotation(updatedAnnotation) {
    this.annotation = updatedAnnotation;
    this.addContentOverlays();
    this.addEditOverlay();
  }

  addContentOverlays() {
    for (const link of this.links) {
      const overlay = new AnnotationContentOverlay(this.viewer, this.annotation);
      //
      // DISABLE OSD MOUSE NAV
      //
      link.onmouseenter = (event) => {
        this.viewer.setMouseNavEnabled(false);
        overlay.showAnnotation(link, event);
      };

      link.onmouseleave = (/* event */) => {
        this.viewer.setMouseNavEnabled(true);
        overlay.hideAnnotation();
      };
    }
  }

  addEditOverlay() {
    this.links.forEach((link) => {
      link.addEventListener('click', () => {
        this.selectedTextAnno(this, link);
      });
    });
  }

  // showAnnotation(event) {
  //   const content = document.createElement('div');
  //   content.className = 'rdx-annotation-content';
  //   content.innerHTML = firstComment.value;
  //   const { x, y } = this.viewer.getOverlayById(event.target).location;
  //   this.createOverlay(x, y);
  //   const y = event.screenY;
  //   const x = event.screenX;
  // }

  hideAnnotation() {
    this.viewer.removeOverlay(this.annotationOverlay);
  }

  /*
   * Get all following siblings of each element up to but not including
   * the element matched by the selector
   * Adapted from Chris Ferdinandi https://vanillajstoolkit.com/helpers/nextuntil/
   * @return {Array} The siblings
   */
  getRange() {
    // Setup siblings array
    const siblings = [this.start];

    // Get the next sibling element
    let elem = this.start?.nextElementSibling;

    // As long as a sibling exists
    if (this.start !== this.end) {
      while (elem) {
        // Push it to the siblings array
        siblings.push(elem);
        // If we've reached our match, bail
        if (elem === this.end) break;
        // Get the next sibling element
        elem = elem.nextElementSibling;
      }
    }

    return siblings;
  }

  removeLinks() {
    try {
      for (let link of this.links) {
        link = document.querySelector(`[data-id="${this.annotation.id}"]`);
        link.parentElement.innerHTML = link.parentElement.innerText;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async addLinks() {
    if (this.range.length === 1) {
      this.handlePart();
    } else {
      this.handleStart();
      this.handleEnd();
    }
    this.range.forEach((wordSpan) => {
      const link = this.create_link();
      link.innerText = wordSpan.innerText;
      wordSpan.innerText = '';
      wordSpan.append(link);
    });
  }

  create_link() {
    const link = document.createElement('button');
    link.setAttribute('role', 'link');
    link.setAttribute('data-id', this.id);
    link.className = `rdx-text-anno anno-${this.id}`;
    this.links.push(link);
    return link;
  }

  handlePart() {
    const word = this.start.innerText;
    const link = this.create_link();
    const start = word.slice(0, this.startOffset);
    const end = word.slice(this.endOffset, word.length);
    link.innerText = word.slice(this.startOffset, this.endOffset);
    this.start.innerHTML = start;
    this.start.append(link);
    this.start.append(end);
  }

  handleStart() {
    this.range.pop();
    const word = this.start.innerText;
    const link = this.create_link();
    link.innerText = word.slice(this.startOffset, word.length);
    this.start.innerHTML = `${word.slice(0, this.startOffset)}`;
    this.start.append(link);
  }

  handleEnd() {
    this.range.shift();
    const word = this.end.innerText;
    const link = this.create_link();
    link.innerText = word.slice(0, this.endOffset);
    this.end.innerHTML = word.slice(this.endOffset, word.length);
    this.end.prepend(link);
  }

  createOverlay(x, y) {
    const firstComment = this.annotation.body.find((b) => b.purpose === 'commenting');
    this.annotationOverlay = document.createElement('div');
    this.annotationOverlay.className = 'rdx-annotation-content';
    this.annotationOverlay.innerHTML = firstComment.value;
    this.viewer.addOverlay({
      element: this.annotationOverlay,
      location: new OpenSeadragon.Rect(x + -50, y + 50, 2, 2),
    });
  }
}

export default TextAnnotation;
