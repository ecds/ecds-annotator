import React from 'react';
import ReactDOM from 'react-dom/client';
import Manifest from './components/manifest/Manifest';
import './index.scss';

class ECDSAnnotator {
  constructor({
    manifest, token, user, id,
  }) {
    const rootElement = document.getElementById(id);
    rootElement.style.height = '100%';

    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <div className="ecds-annotator flex flex-col h-full">
        <Manifest
          manifest={manifest}
          token={token}
          user={user}
        />
      </div>,
    );
  }
}

// eslint-disable-next-line import/prefer-default-export
export const init = (config) => new ECDSAnnotator(config);
