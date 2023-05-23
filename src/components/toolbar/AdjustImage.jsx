/* eslint-disable no-param-reassign */
import React, { useContext, useEffect, useState } from 'react';
import {
  FaSun,
} from 'react-icons/fa';
import {
  TbAdjustments,
  TbAdjustmentsOff,
  TbDroplet,
} from 'react-icons/tb';
import { ImContrast } from 'react-icons/im';
import {
  AiOutlineRotateLeft,
  AiOutlineRotateRight,
} from 'react-icons/ai';
import { FiRotateCcw } from 'react-icons/fi';
import { IoInvertModeOutline, IoColorFilterOutline } from 'react-icons/io5';
import ViewerContext, { ManifestContext } from '../../ViewerContext';
import Tooltip from '../tooltip/Tooltip';

const Button = ({ onClick, tooltipContent, children }) => (
  <Tooltip content={tooltipContent} className="pl-2 pr-1 border-l-2 border-white w-max">
    <button type="button" onClick={onClick}>
      {children}
    </button>
  </Tooltip>
);

const RangeSelector = ({
  onChange,
  tooltipContent,
  value,
  children,
}) => (
  <Tooltip content={tooltipContent} className="flex pl-3 pr-1 items-center border-l-2 border-white w-max">
    <div>
      {children}
    </div>
    <div className="ml-2.5 bg-black/50">
      <input
        type="range"
        value={value}
        min={0}
        max={200}
        onChange={({ target }) => onChange(target.value)}
      />
    </div>
    <div className="text-black px-3 bg-black/50 text-sm h-[36px]">
      <input
        type="number"
        min={0}
        max={200}
        step={1}
        value={value}
        onChange={({ target }) => onChange(target.value)}
        className="my-[20%] border-none outline-none"
      />
    </div>
    <div className="text-white pr-3 py-2 bg-black/50 text-sm h-[36px]">
      %
    </div>
  </Tooltip>
);

function AdjustImage() {
  const { viewer } = useContext(ViewerContext);
  const { currentCanvas } = useContext(ManifestContext);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotate, setRotate] = useState(0);
  const [saturate, setSaturate] = useState(100);
  const [showTools, setShowTools] = useState(false);
  const [invert, setInvert] = useState(false);
  const [grayscale, setGrayscale] = useState(false);

  useEffect(() => {
    viewer.canvas.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) invert(${invert ? '1' : '0'}) grayscale(${grayscale ? '1' : '0'})`;
  }, [
    brightness,
    contrast,
    grayscale,
    invert,
    saturate,
    viewer,
  ]);

  useEffect(() => {
    viewer.viewport.setRotation(rotate);
  }, [rotate, viewer]);

  const resetImage = () => {
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setInvert(false);
    setGrayscale(false);
    viewer.viewport.setRotation(0);
  };

  useEffect(() => {
    resetImage();
  }, [currentCanvas]);

  return (
    <>
      <Tooltip content={showTools ? 'Hide Image Adjust Tools' : 'Show Image Adjust Tools'}>
        <button type="button" onClick={() => setShowTools(!showTools)}>
          {showTools ? <TbAdjustmentsOff /> : <TbAdjustments />}
        </button>
      </Tooltip>
      {showTools && (
        <>
          <Button tooltipContent="Rotate 90 degrees to the left." onClick={() => setRotate(rotate - 90)}>
            <AiOutlineRotateLeft />
          </Button>
          <Button tooltipContent="Rotate 90 degrees to the right." onClick={() => setRotate(rotate + 90)}>
            <AiOutlineRotateRight />
          </Button>
          <RangeSelector
            tooltipContent="Adjust image brightness."
            onChange={setBrightness}
            value={brightness}
          >
            <FaSun />
          </RangeSelector>
          <RangeSelector
            tooltipContent="Adjust image contrast"
            onChange={setContrast}
            value={contrast}
          >
            <ImContrast />
          </RangeSelector>
          <RangeSelector
            tooltipContent="Adjust image saturation."
            onChange={setSaturate}
            value={saturate}
          >
            <TbDroplet />
          </RangeSelector>
          <Button tooltipContent="Invert image colors." onClick={() => setInvert(!invert)}>
            <IoInvertModeOutline />
          </Button>
          <Button tooltipContent="Grayscale." onClick={() => setGrayscale(!grayscale)}>
            <IoColorFilterOutline />
          </Button>
          <Button tooltipContent="Reset image." onClick={resetImage}>
            <FiRotateCcw />
          </Button>
        </>
      )}
    </>
  );
}

export default AdjustImage;
