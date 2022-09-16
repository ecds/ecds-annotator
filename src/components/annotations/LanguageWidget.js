import { LANGUAGES } from '../../utils/languages';

const LanguageWidget = (props) => {
  const container = document.createElement('div');
  const inputField = document.createElement('input');
  inputField.id = 'annotation-language-input';
  inputField.value = LANGUAGES[navigator.language];
  const label = document.createElement('label');
  label.innerText = 'Language';
  label.setAttribute('for', 'annotation-language-input');
  const suggestionsUl = document.createElement('ul');
  suggestionsUl.id = 'suggestions';

  [label, inputField, suggestionsUl].forEach((element) => {
    container.appendChild(element);
  });

  if (props.annotation) {
    let comment = props.annotation.bodies.find( body => body.purpose == 'commenting');

    if (!comment) {
      comment = {
        purpose: 'commenting',
        type: 'TextualBody',
        value: '',
        language: navigator.language
      };

      props.annotation.bodies.push(comment);
    }

    let commentIndex = props.annotation.bodies.indexOf(comment);

    // editor.events.on('change.textLength', (value) => {
    //   props.annotation.body[commentIndex].value = value;
    // });

    // editor.value = props.annotation.body[commentIndex].value;

    const changeAutoComplete = ({ target }) => {
      let data = target.value;
      suggestionsUl.innerHTML = ``;
      if (data.length) {
        let autoCompleteValues = autoComplete(data);
        autoCompleteValues.forEach(value => { addItem(LANGUAGES[value]); });
      }
    }

    const autoComplete = (inputValue) => {
      const suggestions = [];
      for (const l in LANGUAGES) {
        if (LANGUAGES[l].toLowerCase().startsWith(inputValue.toLowerCase())) {
          suggestions.push(l)
        }
      }
      return suggestions;
    }

    const addItem = (value) => {
      suggestionsUl.innerHTML = suggestionsUl.innerHTML + `<li>${value}</li>`;
    }

    const selectItem = ({ target }) => {
      if (target.tagName === 'LI') {
        for (const lang in LANGUAGES) {
          if (LANGUAGES[lang] == target.textContent) {
            props.annotation.body[commentIndex].language = lang;
          }
        }
        inputField.value = target.textContent;
        suggestionsUl.innerHTML = ``;
      }
    }

    inputField.addEventListener('input', changeAutoComplete);
    suggestionsUl.addEventListener('click', selectItem);
  }

  return container;
}

export default LanguageWidget;
