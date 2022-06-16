import { Jodit } from 'jodit';

const EditorWidget = (props) => {
console.log("🚀 ~ file: EditorWidget.js ~ line 4 ~ EditorWidget ~ props", props)
  const textArea = document.createElement('textarea');
  textArea.id = 'editor';
  const container = document.createElement('div');
  container.appendChild(textArea)

  const editor = Jodit.make(textArea, {
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    toolbarAdaptive: false,
    buttons: 'bold,italic,underline,image,link,undo,redo,source,fullsize',
    buttonsSM:  'bold,italic,underline,link,undo,redo,source'
  });
  console.log("🚀 ~ file: EditorWidget.js ~ line 15 ~ EditorWidget ~ editor", editor)

  let comment = props.annotation.bodies.find( body => body.purpose == 'commenting');

  if (!comment) {
    comment = {
      purpose: 'commenting',
      type: 'TextualBody',
      value: ''
    };

    props.annotation.bodies.push(comment);
  }

  // comment.modified = props.env.getCurrentTimeAdjusted();

  let commentIndex = props.annotation.bodies.indexOf(comment);

  editor.events.on('change.textLength', (value) => {
    props.annotation.body[commentIndex].value = value;
  });

  editor.value = props.annotation.body[commentIndex].value;

  // container.appendChild(editor.toolbarContainer);
  // container.appendChild(editor.editor);
  console.log("🚀 ~ file: EditorWidget.js ~ line 42 ~ EditorWidget ~ container", container)
  return container;
}

export default EditorWidget;
