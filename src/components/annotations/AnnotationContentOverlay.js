import OpenSeadragon from 'openseadragon';

const createAnnotationContentOverlay = (viewer, annotation) => {
  const comment = annotation.body.find((b) => b.purpose === 'commenting')?.value;
  const tags = annotation.body.filter((b) => b.purpose === 'tagging');

  const overlayEl = document.createElement('div');
  overlayEl.setAttribute('role', 'dialog');
  overlayEl.className = 'rdx-annotation-content';

  const innerSection = document.createElement('div');
  innerSection.classList.add(
    'relative', 'bg-white', 'rounded-lg', 'text-left',
    'overflow-hidden', 'shadow-xl', 'transform', 'transition-all',
    'w-96', 'sm:max-w-lg', 'sm:w-full', 'p-4', 'z-10',
  );
  innerSection.innerHTML = comment;

  if (tags.length > 0) {
    const tagsSection = document.createElement('section');
    tagsSection.innerText = `Tags: ${tags.map((t) => t.value).join(', ')}`;
    innerSection.appendChild(tagsSection);
  }

  overlayEl.appendChild(innerSection);

  new OpenSeadragon.MouseTracker({
    element: overlayEl,
    clickHandler(event) {
      const { target } = event.originalEvent;
      if (target.matches('a')) {
        if (target.getAttribute('target') === '_blank') {
          window.open(target.getAttribute('href'));
        } else {
          // eslint-disable-next-line no-restricted-globals
          location.href = target.getAttribute('href');
        }
      }
    },
  });

  const hide = () => {
    viewer.removeOverlay(overlayEl);
    viewer.canvas.removeEventListener('click', hide);
  };

  const show = (element) => {
    if (element.tagName === 'BUTTON') {
      const { x, y } = viewer.getOverlayById(element.parentElement).position;
      viewer.addOverlay({
        element: overlayEl,
        location: new OpenSeadragon.Rect(x + 100, y + 100, window.innerWidth * 0.75, 2),
      });
    } else {
      const { x, y, width, height } = element.getBBox();
      viewer.addOverlay({
        element: overlayEl,
        location: new OpenSeadragon.Rect(x + width / 4, y + height / 4, window.innerWidth * 0.75, 2),
      });
    }
    viewer.canvas.addEventListener('click', hide);
  };

  return { show, hide };
};

export default createAnnotationContentOverlay;
