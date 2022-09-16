import OpenSeadragon from 'openseadragon';

class AnnotationContentOverlay {
  constructor(viewer, annotation) {
    this.viewer = viewer;
    this.annotation = annotation;
    this.comment = this.annotation.body.find(b => b.purpose == 'commenting').value;
    this.tags = this.annotation.body.filter(b => b.purpose == 'tagging');
    this.annotationOverlay = document.createElement('div');
    this.annotationOverlay.setAttribute('role', 'dialog');
    this.annotationOverlay.className = 'rdx-annotation-content';
    const innerSection = document.createElement('div');
    innerSection.classList.add('relative', 'bg-white', 'rounded-lg', 'text-left', 'overflow-hidden', 'shadow-xl', 'transform', 'transition-all', 'w-96', 'sm:max-w-lg', 'sm:w-full', 'p-4', 'z-10');
    innerSection.innerHTML = this.comment;
    if (this.tags.length > 0) {
      const tagsSection = document.createElement('section');
      tagsSection.innerText = `Tags: ${this.tags.map(t => t.value).join(', ')}`;
      innerSection.appendChild(tagsSection);
    }
    this.annotationOverlay.appendChild(innerSection);

    this.viewer.canvas.addEventListener('click', () => { this.hideAnnotation() });
  }

  showAnnotation(element, event) {
    console.log("🚀 ~ file: AnnotationContentOverlay.js ~ line 28 ~ AnnotationContentOverlay ~ showAnnotation ~ element, event", element, event)
    // const element = document.querySelector(`[data-id="${annotation.id}"]`)

    if (element.tagName === 'BUTTON') {
      let { x, y } = this.viewer.getOverlayById(element.parentElement).position;

      this.viewer.addOverlay({
        element: this.annotationOverlay,
        location: new OpenSeadragon.Rect(x + 100, y + 100, window.innerWidth * .75, 2)
      });
    } else {
      let { x, y, width, height } = element.getBBox();

      this.viewer.addOverlay({
        element: this.annotationOverlay,
        location: new OpenSeadragon.Rect(x + width / 4, y + height / 4, window.innerWidth * .75, 2)
      });
    }

  }

  hideAnnotation() {
    this.viewer.removeOverlay(this.annotationOverlay);
  }

}

export default AnnotationContentOverlay;
