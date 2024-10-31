import React, { useContext } from "react";
import { AppContext } from "../../ViewerContext";
import Tooltip from "../tooltip/Tooltip";

const UIActions = ({}) => {
  const { uiActions } = useContext(AppContext);
  return (
    <>
      {uiActions.map((uiAction) => (
        <Tooltip key={uiAction.id} content={uiAction.tooltipContent}>
          <button
            type="button"
            aria-label={uiAction.tooltipContent}
            onClick={() => uiAction.onClick()}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: uiAction.icon,
            }}
          />
        </Tooltip>
      ))}
    </>
  );
};

export default UIActions;
