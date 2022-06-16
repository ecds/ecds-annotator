import React from 'react';
import OpenSeadragon from 'openseadragon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVectorSquare, faDrawPolygon, faPen, faICursor, faLocationPin, faComment, faCommentSlash, faTableCells } from '@fortawesome/free-solid-svg-icons';
import { faCircle } from '@fortawesome/free-regular-svg-icons';
import { MdGesture } from 'react-icons/md';
import Tooltip from '../tooltip/Tooltip';

import './Toolbar.scss';

class Toolbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeTool: null
    }

    this.ref = React.createRef();

    this.selectTool = this.selectTool.bind(this);
    this.toggleTools = this.toggleTools.bind(this);
    this.showThumbnails = this.showThumbnails.bind(this);
    this.addControl = this.addControl.bind(this);
  }

  componentDidMount() {
    if (this.ref.current && this.props.viewer) {
      const controlElements = this.props.viewer.controls.map(control => control.element);

      if (controlElements.includes(this.ref.current)) return;

      this.addControl()
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isAnnotating && !this.props.isAnnotating && this.state.activeTool) {
      this.setState({ activeTool: null });
    }
  }

  selectTool(tool) {
    this.setState({ activeTool: tool });
    if (tool === 'text') {
      this.props.startTextAnnotation();
    } else {
      this.props.annotorious.setDrawingEnabled(true);
      this.props.annotorious.setDrawingTool(tool);
    }
    console.log("🚀 ~ file: Toolbar.jsx ~ line 48 ~ Toolbar ~ selectTool ~ this.props.annotorious", this.props.annotorious)
  }

  toggleTools() {
    this.props.toggleTools();
  }

  addControl() {
    const controlOptions = {
        anchor: OpenSeadragon.ControlAnchor.TOP_LEFT,
        autoFade: false
      }
      this.props.viewer.addControl(this.ref.current, controlOptions);
  }

  showThumbnails() {
    this.props.setShowAll(true);
  }

  render() {
    return (
      <div ref={this.ref} className='Toolbar ml-3 mt-2 w-16'>
        <div>
          <Tooltip content="Show thumbnails of all pages.">
            <button onClick={() => this.showThumbnails()}><FontAwesomeIcon icon={faTableCells} rotation={90}   /></button>
          </Tooltip>
        </div>
        {this.props.ocrReady &&
          <div>
            <Tooltip content={`${this.props.expandTools ? "Hide" : "Show"} annotations and tools`}>
              <button onClick={this.toggleTools}><FontAwesomeIcon icon={this.props.expandTools ? faCommentSlash : faComment} /></button>
            </Tooltip>
          </div>
        }
        {(this.props.expandTools && this.props.ocrReady) &&
          <>
            <div>
              <Tooltip content="Draw a rectangle to add annotation">
                <button className={this.state.activeTool === "rect" ? "active": ""} onClick={() => this.selectTool('rect')}><FontAwesomeIcon icon={faVectorSquare} /></button>
              </Tooltip>
            </div>
            <div>
              <Tooltip content="Draw a polygon to add annotation">
                <button className={this.state.activeTool === "polygon" ? "active": ""} onClick={() => this.selectTool('polygon')}><FontAwesomeIcon icon={faDrawPolygon} /></button>
              </Tooltip>
            </div>
            <div>
              <Tooltip content="Draw a circle to add annotation">
                <button className={this.state.activeTool === "circle" ? "active": ""} onClick={() => this.selectTool('circle')}><FontAwesomeIcon icon={faCircle} /></button>
              </Tooltip>
            </div>
            <div>
              <Tooltip content="Freehand annotation">
                <button className={this.state.activeTool === "freehand" ? "active": ""} onClick={() => this.selectTool('freehand')}><MdGesture /></button>
              </Tooltip>
            </div>
            <div>
              <Tooltip content="Annotate a point">
                <button className={this.state.activeTool === "point" ? "active": ""} onClick={() => this.selectTool('point')}><FontAwesomeIcon icon={faLocationPin} /></button>
              </Tooltip>
            </div>
            <div>
              <Tooltip content="Select text to annotate">
                <button className={this.state.activeTool === "text" ? "active": ""} onClick={() => this.selectTool('text')}><FontAwesomeIcon icon={faICursor} /></button>
              </Tooltip>
            </div>
          </>
        }
      </div>
    )
  }
}

export default Toolbar;
