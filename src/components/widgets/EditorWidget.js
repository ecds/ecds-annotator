import { Jodit } from 'jodit';
import './EditorWidget.scss';

const EditorWidget = ({ annotation }) => {
  const textArea = document.createElement('textarea');
  textArea.id = 'editor';
  const container = document.createElement('div');

  container.appendChild(textArea);

  const editor = Jodit.make(textArea, {
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    toolbarAdaptive: false,
    buttons: 'bold,italic,underline,image,link,undo,redo,source,fullsize',
    buttonsSM: 'bold,italic,underline,link,undo,redo,source',
  });

  if (annotation) {
    let comment = annotation.bodies.find((body) => body.purpose === 'commenting');

    if (!comment) {
      comment = {
        purpose: 'commenting',
        type: 'TextualBody',
        value: '',
      };

      annotation.bodies.push(comment);
    }

    const commentIndex = annotation.bodies.indexOf(comment);

    editor.events.on('change.textLength', (value) => {
      // eslint-disable-next-line no-param-reassign
      annotation.body[commentIndex].value = value;
    });

    editor.value = annotation.body[commentIndex].value;
  }

  return container;
};

export default EditorWidget;
