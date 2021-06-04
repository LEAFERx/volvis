<template>
  <div>
    <input type="file" ref="file" @change="onUpload">
    <canvas id="scene" ref="canvas"></canvas>
  </div>
</template>

<script>
import { init } from '@/render';

export default {
  name: 'Scene',
  cnvs: null,
  // vlmdata: () => ({
  //   volumeData: null,
  // }),
  mounted() {
    // init(this.$refs.canvas, null); // This line works. 
    // this.cnvs = this.$refs.canvas; 
  },
  methods: {
    onUpload(event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (vm => () => {
        const arr = reader.result;
        const view = new Uint8Array(arr);
        const data = Float32Array.from(view);
        // console.log(view.length);
        // const data = new Array();
        // for (let i = 0; i < 178; i++) {
        //   const tmp = new Array();
        //   for (let j = 0; j < 256; j++) {
        //     const tmp1 = new Array();
        //     for (let k = 0; k < 256; k++) {
        //       tmp1.push(view[178 * 256 * i + 256 * j + k])
        //     }
        //     tmp.push(tmp1);
        //   }
        //   data.push(tmp);
        // }
        // console.log(data);
        // this.volumeData = data;
        init(vm.$refs.canvas, data); // This line does not work.
      })(this);
      reader.readAsArrayBuffer(file);
    },
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
