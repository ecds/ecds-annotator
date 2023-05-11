import React, { useEffect, useRef, useState } from 'react';
import OCR from './OCR';

const OCRAnnotations = ({
  annotations,
  setOcrReady,
  viewer,
}) => {
  const containerRef = useRef();

  useEffect(() => {
    console.log('🚀 ~ file: OCRAnnotations.jsx:10 ~ containerRef:', containerRef.current);
  }, [containerRef]);

  return (
    <div ref={containerRef}>
      {annotations.map((word) => (
        <span
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: word,
          }}
        />
      ))}
    </div>
  );
};

export default OCRAnnotations;
