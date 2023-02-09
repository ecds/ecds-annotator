import React, { useEffect, useState } from 'react';
import Viewer from '../viewer/Viewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faComment } from '@fortawesome/free-solid-svg-icons'

import './Manifest.scss';

function Manifest(props) {

  const [data, setData] = useState(null);
  const [manifestId, setManifestId] = useState(null);
  const [canvases, setCanvases] = useState([]);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [currentCanvasPid, setCurrentCanvasPid] = useState(null);
  const [firstCanvas, setFirstCanvas] = useState({label: 'first'});
  const [lastCanvas, setLastCanvas] = useState({label: 'last'});
  const [canvasCount, setCanvasCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [thumbnails, setThumbnails] = useState([]);
  const [userAnnotations, setUserAnnotations] = useState([]);

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
  });

  useEffect(() => {
    if (showAll) {
      history.pushState({}, null, currentCanvas);
    } else if (currentCanvas?.id) {
      history.pushState({}, null, getCanvasPid(currentCanvas.id));
    }
  }, [currentCanvas, showAll]);

  useEffect(() => {
    async function fetchManifest() {
      if (!data) {
        let response = await fetch(props.manifest);
        let json = await response.json();
        setData(json);
        setThumbnails(
          json.items
              .filter(
                i => i.type === 'Canvas'
              )
              .flatMap(
                c => c.items
              )
              .map(
                b => {
                  if (b.body.type === 'Image'){
                    return b.body
                  }
                }
              )
        );
      }
    };

    if (!data) fetchManifest();
  }, [data, setData, setThumbnails]);

  useEffect(() => {
    if (thumbnails.length === 0) return;

    setUserAnnotations(data.annotations ?? []);
  }, [thumbnails, setUserAnnotations]);

  useEffect(() => {
    if (!data) return;

    setCanvases(data.items.filter((i) => i.type === 'Canvas'));

    if (!currentCanvas) {
      const pids = canvases.map(canvas => getCanvasPid(canvas.id));
      const pidFromPath = getCanvasPid(location.pathname);
      setShowAll(pidFromPath === 'all');
      const currentCanvasIndex = pidFromPath ? pids.indexOf(pidFromPath) : 0;
      setCurrentCanvas(canvases[currentCanvasIndex]);
      setFirstCanvas(canvases[0]);
      setLastCanvas(canvases[canvases.length - 1]);
      setCanvasCount(canvases.length);
      setCurrentCanvasPid(pids[currentCanvasIndex]);
    }
  }, [
        setCanvases,
        data,
        currentCanvas,
        setShowAll,
        setCanvasCount,
        setCurrentCanvas,
        setFirstCanvas,
        setLastCanvas,
        setCurrentCanvasPid
      ]
  );

  useEffect(() => {
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
  }, [showAll]);

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
      <div className="flex flex-wrap justify-center overflow-auto items-end">
          {
            thumbnails.map((thumbnail, index) => {
              const userAnnotationCount = userAnnotations.filter(a => a.target.source === thumbnail.id).length
              return (
                <div className='p-4 rdx-thumbnail' key={index}>
                    {userAnnotationCount > 0 && (
                      <div className='fa-layers fa-fw relative top-4 left-[85%] text-3xl block'>
                        <FontAwesomeIcon icon={faComment} size="9x" style={{ color: "var(--link-color)" }} />
                        <span class="fa-layers-text fa-inverse text-base">{userAnnotationCount}</span>
                      </div>
                    )}
                  <button onClick={() => goToCanvas(index)}>
                    <img src={`${thumbnail.id}/full/200,/0/default.jpg`} alt={`Page ${index + 1}`} />
                    <p className='flex justify-center'>
                      {index + 1}
                    </p>
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
