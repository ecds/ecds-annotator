/* eslint-disable no-restricted-globals */
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faComment } from '@fortawesome/free-solid-svg-icons';
import Viewer from '../viewer/Viewer';
import { getCanvasPid } from '../../utils/canvasUtils';

import './Manifest.scss';

function Manifest({ manifest, token, user }) {
  const [manifestData, setManifestData] = useState(null);
  const [canvases, setCanvases] = useState([]);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [currentCanvasPid, setCurrentCanvasPid] = useState(null);
  const [firstCanvas, setFirstCanvas] = useState({ label: 'first' });
  const [lastCanvas, setLastCanvas] = useState({ label: 'last' });
  const [canvasCount, setCanvasCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [annotatedCanvases, setAnnotatedCanvases] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  // const [userAnnotations, setUserAnnotations] = useState([]);

  window.addEventListener('popstate', () => {
    const pathPid = getCanvasPid(location.pathname);
    if (pathPid === 'all') {
      setShowAll(true);
    } else if (pathPid !== currentCanvasPid) {
      setShowAll(false);
      setCurrentCanvas(canvases.find((canvas) => canvas.id.includes(pathPid)));
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

  // useEffect(() => {
  //   async function fetchVolumeAnnotations() {
  //     const response = await fetch('https://readux-dev.org:3000/annotations/jay/snkng');
  //     const annotations = await response.json();
  //     setAnnotatedCanvases(annotations.items.map((item) => item.target.source));
  //   }

  //   if (annotatedCanvases.length === 0) fetchVolumeAnnotations();
  // }, []);

  useEffect(() => {
    async function fetchManifest() {
      if (!manifestData) {
        const response = await fetch(manifest);
        const json = await response.json();
        setManifestData(json);
        setThumbnails(
          json.items
            .filter(
              (i) => i.type === 'Canvas',
            )
            .flatMap(
              (c) => c.items,
            )
            .map(
              // eslint-disable-next-line array-callback-return, consistent-return
              (b) => {
                if (b.body.type === 'Image') {
                  return b.body;
                }
              },
            ),
        );
      }
    }

    if (!manifestData) fetchManifest();
  }, [manifestData, setManifestData, setThumbnails]);

  // useEffect(() => {
  //   if (thumbnails.length === 0) return;
  //   setUserAnnotations(manifestData.annotations ?? []);
  // }, [thumbnails, setUserAnnotations]);

  useEffect(() => {
    if (!manifestData) return;

    setCanvases(manifestData.items.filter((i) => i.type === 'Canvas'));

    if (!currentCanvas) {
      const pids = canvases.map((canvas) => getCanvasPid(canvas.id));
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
    manifestData,
    currentCanvas,
    setShowAll,
    setCanvasCount,
    setCurrentCanvas,
    setFirstCanvas,
    setLastCanvas,
    setCurrentCanvasPid,
  ]);

  useEffect(() => {
    if (showAll) {
      const detail = {
        annotationsOnPage: 0,
        canvas: 'all',
        annotationAdded: false,
        annotationDeleted: false,
      };

      const canvasEvent = new CustomEvent('canvasswitch', { bubbles: true, detail });
      window.dispatchEvent(canvasEvent);
    }
  }, [showAll]);

  // const toggleShowAll = () => {
  //   setShowAll(true);
  //   setCurrentCanvas(null);
  // };

  const goToCanvas = (canvas) => {
    setCurrentCanvas(canvases[canvas]);
    setCurrentCanvasPid(getCanvasPid(canvases[canvas].id));
    setShowAll(false);
  };

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
              const userAnnotationCount = annotatedCanvases.filter(
                (canvas) => canvas === thumbnail.id,
              ).length;
              return (
                <div className="p-4 rdx-thumbnail" key={thumbnail.id}>
                  {userAnnotationCount > 0 && (
                  <div className="fa-layers fa-fw relative top-4 left-[85%] text-3xl block">
                    <FontAwesomeIcon icon={faComment} size="9x" style={{ color: 'var(--link-color)' }} />
                    <span className="fa-layers-text fa-inverse text-base">{userAnnotationCount}</span>
                  </div>
                  )}
                  <button type="button" onClick={() => goToCanvas(index)}>
                    <img src={`${thumbnail.id}/full/200,/0/default.jpg`} alt={`Page ${index + 1}`} />
                    <p className="flex justify-center">
                      {index + 1}
                    </p>
                  </button>
                </div>
              );
            })
          }
      </div>
    );
  } if (currentCanvas) {
    return (
      <div className="Manifest h-full" data-testid="Manifest">

        <div className="h-5/6">
          <Viewer
            canvas={currentCanvas}
            setShowAll={setShowAll}
            showAll={showAll}
            token={token}
            user={user}
          />
        </div>

        <div className="py-8 grid grid-cols-2 gap-2">
          {currentCanvas && (
            <div className="col-span-2 h-fit flex justify-center">
              {canvases.indexOf(currentCanvas) + 1}
              {' '}
              of
              {canvasCount}
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" className="px-6 py-2 rounded-full rdx-page-button" disabled={currentCanvas === firstCanvas} onClick={() => previousCanvas()}>
              <FontAwesomeIcon icon={faAngleLeft} />
              {' '}
              previous
            </button>
          </div>
          <div className="flex justify-start">
            <button type="button" className="px-6 py-2 rounded-full rdx-page-button" disabled={currentCanvas === lastCanvas} onClick={() => nextCanvas()}>
              Next
              <FontAwesomeIcon icon={faAngleRight} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <>loading</>
  );
}

export default Manifest;
