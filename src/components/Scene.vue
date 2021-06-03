<template>
  <canvas id="scene" ref="canvas"></canvas>
</template>

<script>
import { init } from '@/render';

export default {
  name: 'Scene',
  mounted() {
    init(this.$refs.canvas);
  },
}
</script>

<style scoped>
#scene {
  width: 100%;
  height: 90%;
  position: fixed;
  left: 0;
  top: 10%;
}
</style>
