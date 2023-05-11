/* eslint-disable no-param-reassign */
import React, { useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import './TagWidget.scss';

const TagWidget = ({ annotation }) => {
  const inputRef = useRef();
  const [showDelete, setShowDelete] = useState(false);
  const [tags, setTags] = useState(annotation.body.filter((b) => b.purpose === 'tagging') ?? []);

  const emptyTag = {
    type: 'TextualBody',
    purpose: 'tagging',
    value: '',
  };

  useEffect(() => {
    annotation.body = [...annotation.body.filter((anno) => anno.purpose !== 'tagging'), ...tags];
    inputRef.current.value = '';
  }, [tags]);

  const toggle = (tag) => {
    setShowDelete(showDelete === tag ? false : tag);
  };

  const onDelete = (tagToDelete) => (evt) => {
    evt.stopPropagation();
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const onSubmit = () => {
    if (inputRef.current.value === '') return;
    setTags([...tags, { ...emptyTag, value: inputRef.current.value }]);
  };

  // Shorthand
  const tagValue = (tag) => tag.value || tag.source?.label;

  return (
    <div className="r6o-widget r6o-tag">
      { tags.length > 0
        && (
        <ul className="r6o-taglist">
          { tags.map((tag) => (
            <li
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
              role="button"
              key={tagValue(tag)}
              onClick={() => toggle(tag)}
              onKeyUp={({ key }) => { if (key === 'Enter') toggle(tag); }}
            >
              <span className="r6o-label">{tagValue(tag)}</span>

              <CSSTransition in={showDelete === tag} timeout={200} classNames="r6o-delete">
                <span
                  tabIndex={0}
                  role="button"
                  className="r6o-delete-wrapper"
                  onClick={onDelete(tag)}
                  onKeyUp={({ key }) => { if (key === 'Enter') onDelete(tag); }}
                >
                  <span className="r6o-delete">
                    X
                  </span>
                </span>
              </CSSTransition>
            </li>
          ))}
        </ul>
        )}

      <input
        ref={inputRef}
        type="text"
        placeholder="Add tag..."
        onBlur={onSubmit}
        onKeyUp={({ key }) => { if (key === 'Enter') onSubmit(); }}
      />
    </div>
  );
};

export default TagWidget;
