import React, { useContext } from "react";
import { AppContext } from "../../ViewerContext";
import Tooltip from "../tooltip/Tooltip";
import { getCanvasPid } from "../../utils/canvasUtils";

const UIActionButton = ({ uiAction }) => {
  return (
    <Tooltip content={uiAction.tooltipContent}>
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
  );
};

const UIActions = ({}) => {
  const { uiActions } = useContext(AppContext);
  const pathPid = getCanvasPid(location.pathname);
  if (pathPid === "all") {
    return (
      <>
        {uiActions
          .filter((uiAction) => {
            return !uiAction.hideOnAll;
          })
          .map((uiAction) => {
            return <UIActionButton key={uiAction.id} uiAction={uiAction} />;
          })}
      </>
    );
  }

  return (
    <>
      {uiActions.map((uiAction) => {
        return <UIActionButton key={uiAction.id} uiAction={uiAction} />;
      })}
    </>
  );
};

export default UIActions;
