<template>
  <div>
    <canvas id="canvas"></canvas>
  </div>
</template>

<script>
import * as paper from 'paper';
import { CurveEditTool } from '@/curve/tool';

export default {
  data: () => ({
    scope: null,
    aTool: null,
    eTool: null,
  }),
  mounted() {
    const scope = new paper.PaperScope();
    scope.setup('canvas');
    scope.activate();
    this.scope = scope;
    const path1 = new paper.Path();
    const start1 = new paper.Point(0, 0);
    path1.strokeColor = 'black';
    path1.moveTo(start1);
    path1.lineTo(new paper.Point(80, 80));
    path1.lineTo(new paper.Point(0, 160));
    path1.smooth(); 
    this.eTool = new CurveEditTool(scope);
    this.eTool.activate();
  },
}
</script>

<style>

</style>