import React, { useEffect, useRef, useState } from 'react';
import Viewer from '../viewer/Viewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons'

import './Manifest.scss';

function Manifest(props) {

  const [data, setData] = useState(null);
  const [manifestId, setManifestId] = useState(null);
  const [canvases] = useState([]);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [currentCanvasPid, setCurrentCanvasPid] = useState(null);
  const [firstCanvas, setFirstCanvas] = useState({label: 'first'});
  const [lastCanvas, setLastCanvas] = useState({label: 'last'});
  const [canvasCount, setCanvasCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [thumbnails, setThumbnails] = useState(null);

  const canvasEvent = new CustomEvent('canvasswitch', { bubbles: true, detail: {} });

  window.addEventListener('popstate', () => {
    const pathPid = getCanvasPid(location.pathname);
    if (pathPid === 'all') {
      setShowAll(true);
    } else if (pathPid !== currentCanvasPid) {
      setShowAll(false);
      setCurrentCanvas(canvases.find(canvas => canvas.id.includes(pathPid)));
      setCurrentCanvasPid(pathPid);
    }
  })

  async function fetchManifest() {
    if (!data) {
      let response = await fetch(props.manifest);
      let json = await response.json();
      setData(json);
      setThumbnails(
        json.items.map(
          item => item.items.map(
            canvasItems => canvasItems.body
          )
        ).flat().filter(body => body.type == 'Image')
      );
    }
  }

  useEffect(() => {
    if (!data) {
      fetchManifest();
    } else if (canvases.length == 0) {
      data.items.forEach(item => {
        if (item.type === 'Canvas') {
          canvases.push(item);
        }
      });

      if (!currentCanvas) {
        const pids = canvases.map(canvas => getCanvasPid(canvas.id));
        const pidFromPath = getCanvasPid(location.pathname);
        const currentCanvasIndex = pidFromPath ? pids.indexOf(pidFromPath) : 0;
        setCurrentCanvas(canvases[currentCanvasIndex]);
        setFirstCanvas(canvases[0]);
        setLastCanvas(canvases[canvases.length - 1]);
        setCanvasCount(canvases.length);
        setCurrentCanvasPid(pids[currentCanvasIndex]);
      }
    }

    if (showAll) {
      const eventDetails = {
        annotationsOnPage: 0,
        canvas: 'all',
        annotationAdded: false,
        annotationDeleted: false
      }

      for (const [key, value] of Object.entries(eventDetails)) {
        canvasEvent.detail[key] = value;
      }

      window.dispatchEvent(canvasEvent);
    }
  });

  const getCanvasPid = (uri) => {
    const parts = uri.split('/').reverse();

    if (parts[0] === 'canvas') {
      return parts[1];
    }

    return parts[0];
  }

  const toggleShowAll = () => {
    setShowAll(true);
    setCurrentCanvas(null);
  }

  const goToCanvas = (canvas) => {
    setCurrentCanvas(canvases[canvas]);
    setCurrentCanvasPid(getCanvasPid(canvases[canvas].id));
    setShowAll(false);
  }

  const nextCanvas = () => {
    setCurrentCanvas(canvases[canvases.indexOf(currentCanvas) + 1]);
  };

  const previousCanvas = () => {
    setCurrentCanvas(canvases[canvases.indexOf(currentCanvas) - 1]);
  };

  if (showAll && thumbnails) {
    return (
      <div className="flex flex-wrap justify-center overflow-auto">
          {
            thumbnails.map((thumbnail, index) => {
              return (
                <div className='p-4 rdx-thumbnail' key={index}>
                  <button onClick={() => goToCanvas(index)}>
                    <img src={thumbnail} />
                    <p className='flex justify-center'>{index + 1}</p>
                  </button>
                </div>
              )
            })
          }
      </div>
    )
  } else if (currentCanvas) {
    return (
      <div className='Manifest h-full' data-testid="Manifest">

        <div className='h-5/6'>
          <Viewer canvas={currentCanvas} setShowAll={setShowAll} {...props}  />
        </div>

        <div className='py-8 grid grid-cols-2 gap-2'>
          {currentCanvas && (
            <div className='col-span-2 h-fit flex justify-center'>
              {canvases.indexOf(currentCanvas) + 1} of {canvasCount}
            </div>
          )}

          <div className='flex justify-end'>
            <button className='px-6 py-2 rounded-full rdx-page-button' disabled={currentCanvas === firstCanvas} onClick={() => previousCanvas()}><FontAwesomeIcon icon={faAngleLeft} /> previous</button>
          </div>
          <div className='flex justify-start'>
            <button className='px-6 py-2 rounded-full rdx-page-button' disabled={currentCanvas === lastCanvas} onClick={() => nextCanvas()}>Next <FontAwesomeIcon icon={faAngleRight} /></button>
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <>loading</>
    )
  }
}

export default Manifest;
