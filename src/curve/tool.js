import * as paper from 'paper';

export class CurveEditTool {
  constructor(scope) {
    this.scope = scope;
    this.currentKey = '';
    this.selectedPath = null;
    this.selectedPoint = null;

    const tool = new paper.Tool();
    tool.name = 'CurveEdit';
    tool.onMouseDown = function (event) {
      let hitOptions;
      if (this.selectedPath) {
        hitOptions = {
          tolerance: 1,
          segments: true,
          handles: true,
        };
      } else {
        hitOptions = {
          tolerance: 1,
          stroke: true,
          curves: true,
        };
      }
      const hit = scope.project.hitTest(event.point, hitOptions);
      if (hit) {
        if (this.selectedPath) {
          if (hit.type === 'segment' || hit.type === 'handle-in' || hit.type === 'handle-out') {
            this.selectedPoint = {
              segment: hit.segment,
              type: hit.type,
            };
          }
        } else {
          if (hit.type === 'stroke' || hit.type === 'curve') {
            this.selectedPath = hit.location.path;
            this.selectedPath.fullySelected = true;
            this.selectedPoint = null;
          }
        }
      } else {
        if (this.selectedPath) {
          this.selectedPath.fullySelected = false;
        }
        this.selectedPath = null;
        this.selectedPoint = null;
      }
    };
    tool.onMouseDrag = function (event) {
      if (this.selectedPath && this.selectedPoint) {
        let segment = this.selectedPoint.segment;
        if (this.selectedPoint.type === 'segment') {
          segment.point.x += event.delta.x;
          segment.point.y += event.delta.y;
        } else if (this.selectedPoint.type === 'handle-in'){
          segment.handleIn.x += event.delta.x;
          segment.handleIn.y += event.delta.y;
        } else {
          segment.handleOut.x += event.delta.x; 
          segment.handleOut.y += event.delta.y; 
        }
      }
    };
    // tool.onKeyDown = event => {
    
    // };
    // tool.onKeyUp = event => {
    
    // };

    this.tool = tool;
  }

  activate() {
    this.tool.activate();
  }
}

export class AddPointTool {
  constructor(scope) {
    this.scope = scope;
    
    const tool = new paper.Tool();
    tool.name = 'AddPoint';
    this.tool = tool;
  }

  activate() {
    this.tool.activate();
  }
}
