import { UUID } from '../../utils/UUID';

const BaseTextAnno = ({
  annotation, canvas, user, range,
}) => {
  const baseAnno = {
    type: 'Annotation',
    isEqual: () => true,
    body: [
      {
        type: 'TextualBody',
        value: '',
        purpose: 'commenting',
        creator: user,
      },
    ],
    bodies: [
      {
        type: 'TextualBody',
        value: '',
        purpose: 'commenting',
        creator: user,
      },
    ],
    target: {
      source: canvas.id,
      selector: {},
    },
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: UUID(),
    ...annotation || {},
  };

  if (range instanceof Range) {
    baseAnno.target.selector = {
      type: 'RangeSelector',
      startSelector: {
        type: 'XPathSelector',
        value: `//*[@id='${range.startContainer.parentElement.id}']`,
        refinedBy: {
          type: 'TextPositionSelector',
          start: range.startOffset,
        },
      },
      endSelector: {
        type: 'XPathSelector',
        value: `//*[@id='${range.endContainer.parentElement.id}']`,
        refinedBy: {
          type: 'TextPositionSelector',
          end: range.endOffset,
        },
      },
    };
  }

  return baseAnno;
};

export default BaseTextAnno;
