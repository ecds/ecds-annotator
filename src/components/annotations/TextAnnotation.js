import { UUID } from '../../utils/UUID';
import OpenSeadragon from 'openseadragon';

class TextAnnotation {
  constructor(annotation, viewer) {
    if (annotation instanceof Range) {
      return {
        "type": "RangeSelector",
        startSelector: {
            "type": "XPathSelector",
            value: `//*[@id='${annotation.startContainer.parentElement.id}']`,
            refinedBy : {
                "type": "TextPositionSelector",
                start: annotation.startOffset
            }
        },
        endSelector: {
            "type": "XPathSelector",
            value: `//*[@id='${annotation.endContainer.parentElement.id}']`,
            refinedBy : {
                "type": "TextPositionSelector",
                end: annotation.endOffset
            }
        }
      }
    } else {
      annotation.clone = function() { return annotation };
      annotation.isEqual = function() { return true };
      annotation.bodies = annotation.body;
      this.annotation = annotation;
      this.viewer = viewer;

      this.annotationOverlay = null;

      const selector = annotation.target.selector;

      this.id = annotation.id || UUID();

      this.start = document.evaluate(
        selector.startSelector.value,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      this.end = document.evaluate(
        selector.endSelector.value,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      this.range = this.__getRange();

      this.startOffset = selector.startSelector.refinedBy.start;
      this.endOffset = selector.endSelector.refinedBy.end;

      this.links = [];

      this.addLinks();
    }
  }

  showAnnotation(event) {
    // const content = document.createElement('div');
    // content.className = 'rdx-annotation-content';
    // content.innerHTML = firstComment.value;
    // const { x, y } = this.viewer.getOverlayById(event.target).location;
    // this.__createOverlay(x, y);
    // const y = event.screenY;
    // const x = event.screenX;
  }

  hideAnnotation() {
    this.viewer.removeOverlay(this.annotationOverlay);
  }

  /*!
  * Get all following siblings of each element up to but not including the element matched by the selector
  * Adapted from Chris Ferdinandi https://vanillajstoolkit.com/helpers/nextuntil/
  * @return {Array}           The siblings
  */
  __getRange() {

    // Setup siblings array
    let siblings = [this.start];

    // Get the next sibling element
    let elem = this.start.nextElementSibling;

    // As long as a sibling exists
    if (this.start !== this.end) {
      while (elem) {
        // Push it to the siblings array
        siblings.push(elem);
        // If we've reached our match, bail
        if (elem == this.end) break;
        // Get the next sibling element
        elem = elem.nextElementSibling;
      }
    }

    return siblings;
  }

  removeLinks() {
    try {
      this.links.forEach(link => link.parentElement.innerHTML = link.parentElement.innerText);
    } catch {
      // break;
    }
  }

  __create_link() {
    const link = document.createElement('button');
    link.setAttribute('role', 'link');
    link.setAttribute('data-id', this.id);
    link.className = `rdx-text-anno anno-${this.id}`;
    this.links.push(link);
    return link;
  }

  addLinks() {
    if (this.range.length === 1) {
      this.__handlePart();
    } else {
      this.__handleStart();
      this.__handleEnd();
    }
    this.range.forEach(wordSpan => {
      const link = this.__create_link();
      link.innerText = wordSpan.innerText;
      wordSpan.innerText = '';
      wordSpan.append(link);
    })
  }

  __handlePart() {
    const word = this.start.innerText;
    const link = this.__create_link();
    const start = word.slice(0, this.startOffset);
    const end = word.slice(this.endOffset, word.length);
    link.innerText = word.slice(this.startOffset, this.endOffset);
    this.start.innerHTML = start;
    this.start.append(link);
    this.start.append(end);
  }

  __handleStart() {
    this.range.pop();
    const word = this.start.innerText;
    const link = this.__create_link();
    link.innerText = word.slice(this.startOffset, word.length);
    this.start.innerHTML = `${word.slice(0, this.startOffset)}`;
    this.start.append(link);
  }

  __handleEnd() {
    this.range.shift();
    const word = this.end.innerText;
    const link = this.__create_link();
    link.innerText = word.slice(0, this.endOffset);
    this.end.innerHTML = word.slice(this.endOffset, word.length);
    this.end.prepend(link);
  }

  __createOverlay(x, y) {
    const firstComment = this.annotation.body.find(b => b.purpose == 'commenting');
    this.annotationOverlay = document.createElement('div');
    this.annotationOverlay.className = 'rdx-annotation-content';
    this.annotationOverlay.innerHTML = firstComment.value;
    this.viewer.addOverlay({
      element: this.annotationOverlay,
      location: new OpenSeadragon.Rect(x + - 50, y + 50, 2, 2)
    });
  }
}

export default TextAnnotation;
