import React from 'react';
// import logo from './logo.svg';
import Manifest from './components/manifest/Manifest';
import './App.scss';

function App() {
  return (
    <div className="App">
      <Manifest url="https://readux.io/iiif/v2/t4vc6/manifest" />
    </div>
  );
}

export default App;
