<template>
  <div>
    Info <input type="file" ref="file" @change = "onUploadInfo">
    Raw File <input type="file" ref="file" @change="onUpload">
    <canvas id="scene" ref="canvas"></canvas>
  </div>
</template>

<script>
import { init } from '@/render';

export default {
  name: 'Scene',
  bits: null,
  objectSize: (null, null, null),
  stepSize: (null, null, null),
  // vlmdata: () => ({
  //   volumeData: null,
  // }),
  mounted() {
    // init(this.$refs.canvas, null); // This line works. 
    // this.cnvs = this.$refs.canvas; 
  },
  methods: {
    onUploadInfo(event){
      const file = event.target.files[0];      
        const reader = new FileReader();
        reader.onload = () => {
        const arr = reader.result;
        console.log(arr);
        const view = new Uint8Array(arr);
        console.log(view);
        this.bits = view[0];
        this.objectSize = (view[1], view[2], view[3]);
        this.stepSize = (view[4], view[5], view[6]);
        console.log(this.view);
        console.log(this.objectSize);
        console.log(this.stepSize);
      };
      reader.readAsArrayBuffer(file);
    },
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
