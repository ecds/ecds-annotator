/* eslint-disable no-restricted-globals */
import React, { useEffect, useState } from "react";
import { FaAngleLeft, FaAngleRight, FaComment } from "react-icons/fa";
import { ManifestContext } from "../ViewerContext";
import Viewer from "./viewer/Viewer";
import { getCanvasPid } from "../utils/canvasUtils";

import UIActions from "./toolbar/UIActions";

function Manifest({ manifest, user }) {
  const [manifestData, setManifestData] = useState(null);
  const [canvases, setCanvases] = useState([]);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [currentCanvasPid, setCurrentCanvasPid] = useState(null);
  const [firstCanvas, setFirstCanvas] = useState({ label: "first" });
  const [lastCanvas, setLastCanvas] = useState({ label: "last" });
  const [canvasCount, setCanvasCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [annotatedCanvases, setAnnotatedCanvases] = useState([]);
  const [canvasBodies, setCanvasBodies] = useState([]);
  const manifestContextValue = { currentCanvas };

  window.addEventListener("popstate", () => {
    const pathPid = getCanvasPid(location.pathname);
    if (pathPid === "all") {
      setShowAll(true);
    } else if (pathPid !== currentCanvasPid) {
      setShowAll(false);
      setCurrentCanvas(canvases.find((canvas) => canvas.id.includes(pathPid)));
      setCurrentCanvasPid(pathPid);
    }
  });

  useEffect(() => {
    if (showAll) {
      history.pushState({}, null, "all");
    } else if (currentCanvas?.id) {
      history.pushState({}, null, getCanvasPid(currentCanvas.id));
    }
  }, [currentCanvas, showAll]);

  useEffect(() => {
    async function fetchVolumeAnnotations() {
      const response = await fetch(
        `${location.protocol}//${location.host}/annotation_count/${user.id}/${
          location.pathname.split("/").reverse()[2]
        }`
        // "https://localhost:3000/annotations/jay/snkng"
        // "https://localhost:3000/annotations/jay/snkng/"
      );
      const annotations = await response.json();
      // console.log("🚀 ~ fetchVolumeAnnotations ~ annotations:", annotations);
      setAnnotatedCanvases(annotations);
    }

    if (showAll) fetchVolumeAnnotations();
  }, [user, location, showAll]);

  useEffect(() => {
    async function fetchManifest() {
      if (!manifestData) {
        const response = await fetch(manifest);
        const json = await response.json();
        setManifestData(json);
        setCanvasBodies(
          json.items
            .filter((i) => i.type === "Canvas")
            .flatMap((c) => {
              return {
                width: c.width,
                height: c.height,
                ...c.items.find((b) => b.body.type === "Image").body,
              };
            })
        );
      }
    }

    if (!manifestData) fetchManifest();
  }, [manifestData, setManifestData, setCanvasBodies]);

  // useEffect(() => {
  //   if (thumbnails.length === 0) return;
  //   setUserAnnotations(manifestData.annotations ?? []);
  // }, [thumbnails, setUserAnnotations]);

  useEffect(() => {
    if (!manifestData) return;

    setCanvases(manifestData.items.filter((i) => i.type === "Canvas"));

    if (!currentCanvas) {
      const pids = canvases.map((canvas) => getCanvasPid(canvas.id));
      const pidFromPath = getCanvasPid(location.pathname);
      setShowAll(pidFromPath === "all");
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
      setCurrentCanvas(null);
      setCurrentCanvasPid(null);
      const detail = {
        annotationsOnPage: 0,
        canvas: "all",
        annotationAdded: false,
        annotationDeleted: false,
      };

      const canvasEvent = new CustomEvent("canvasswitch", {
        bubbles: true,
        detail,
      });
      window.dispatchEvent(canvasEvent);
    }
  }, [showAll]);

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

  if (showAll && canvasBodies) {
    return (
      <ManifestContext.Provider value={manifestContextValue}>
        <div className="flex flex-col ml-3 mt-2 text-2xl p-4">
          <UIActions />
        </div>
        <div className="flex flex-wrap justify-center overflow-auto items-end mr-8">
          {canvasBodies.map((canvasBody, index) => {
            let count = 0;
            if (annotatedCanvases && annotatedCanvases[index]) {
              count = annotatedCanvases[index]?.count ?? 0;
            }
            return (
              <div
                className="px-4 min-h-[200px] min-w-[200px]"
                key={canvasBody.id}
              >
                {count > 0 && (
                  <div className="relative top-4 left-[85%] w-8 h-8 text-3xl block">
                    <FaComment size="32" className="text-[#457B9D]" />
                    <span className="fa-layers-text fa-inverse text-base relative -top-10 inline-block text-center w-8">
                      {count}
                    </span>
                  </div>
                )}
                <button type="button" onClick={() => goToCanvas(index)}>
                  <img
                    src={
                      currentCanvas
                        ? ""
                        : `${canvasBody.id}/full/200,/0/default.jpg`
                    }
                    loading="lazy"
                    alt={`Page ${index + 1}`}
                    width={200}
                    height={Math.ceil(
                      (canvasBody.height / canvasBody.width) * 200
                    )}
                  />
                  <p className="flex justify-center">{index + 1}</p>
                </button>
              </div>
            );
          })}
        </div>
      </ManifestContext.Provider>
    );
  }

  if (currentCanvas) {
    return (
      <ManifestContext.Provider value={manifestContextValue}>
        <div className="Manifest h-full flex flex-col" data-testid="Manifest">
          <div className="h-5/6">
            <Viewer
              canvas={currentCanvas}
              setShowAll={setShowAll}
              showAll={showAll}
            />
          </div>
          <div className="my-8 grid grid-cols-2 gap-2">
            {currentCanvas && (
              <div className="col-span-2 h-fit flex justify-center">
                {canvases.indexOf(currentCanvas) + 1} of {canvasCount}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                className="px-6 py-2 rounded-full bg-white text-black min-w-[25%] uppercase disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={currentCanvas === firstCanvas}
                onClick={() => previousCanvas()}
              >
                <FaAngleLeft className="inline" /> previous
              </button>
            </div>
            <div className="flex justify-start">
              <button
                type="button"
                className="px-6 py-2 rounded-full bg-white text-black min-w-[25%] uppercase disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={currentCanvas === lastCanvas}
                onClick={() => nextCanvas()}
              >
                Next
                <FaAngleRight className="inline" />
              </button>
            </div>
          </div>
        </div>
      </ManifestContext.Provider>
    );
  }
  return <>loading</>;
}

export default Manifest;
