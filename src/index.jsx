import React from 'react';
import ReactDOM from 'react-dom/client';
import AnnotationServer from './utils/AnnotationServer';
import Manifest from './components/manifest/Manifest';
import './index.scss';
// import reportWebVitals from './reportWebVitals';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   // <React.StrictMode>
//     <App />
//   // </React.StrictMode>
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();

class ECDSAnnotator {
  constructor(conf) {
    console.log('2/9/2023b');
    this.annotationServer = new AnnotationServer({
      host: conf.host,
      token: conf.token
    });

    this._app = React.createRef();

    const root_element = document.getElementById(conf.id);
    root_element.style.height = '100%';

    const root = ReactDOM.createRoot(root_element);

    root.render(
      <div className='ecds-annotator flex flex-col h-full'>
        <Manifest {...conf} />
      </div>
    );
  }
}

export const init = config => new ECDSAnnotator(config);
