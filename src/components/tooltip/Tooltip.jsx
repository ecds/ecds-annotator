// Thanks Vitor Paladini https://dev.to/vtrpldn/how-to-make-an-extremely-reusable-tooltip-component-with-react-and-nothing-else-3pnk
import React, { useState, useEffect } from "react";
import "./Tooltip.scss";

const Tooltip = (props) => {
  let timeout;
  const [active, setActive] = useState(false);

  const showTip = () => {
    if (props.static) return;

    timeout = setTimeout(() => {
      setActive(true);
    }, props.delay || 0);
  };

  const hideTip = () => {
    if (props.static) return;

    clearInterval(timeout);
    setActive(false);
  };

  useEffect(() => {
    if (props.static) {
      setActive(props.show);
    }
  });

  return (
    <div
      className="Tooltip-Wrapper"
      // When to show the tooltip
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      {/* Wrapping */}
      {props.children}
      {active && (
        <div className={`Tooltip-Tip ${props.direction || "right"}`}>
          {/* Content */}
          {props.content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
