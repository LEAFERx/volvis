<template>
  <div>
    <input type="file" ref="file" @change="onUpload">
  </div>
</template>

<script>
import frag from '@/shaders/frag.glsl';

export default {
  mounted() {
    console.log(frag);
  },
  methods: {
    onUpload(event) {
      const file = event.target.files[0];
      console.log(file);
      const reader = new FileReader();
      reader.onload = () => {
        const arr = reader.result;
        const view = new Uint8Array(arr);
        console.log(view.length);
        const data = new Array();
        for (let i = 0; i < 178; i++) {
          const tmp = new Array();
          for (let j = 0; j < 256; j++) {
            const tmp1 = new Array();
            for (let k = 0; k < 256; k++) {
              tmp1.push(view[178 * i + 256 * j + k])
            }
            tmp.push(tmp1);
          }
          data.push(tmp);
        }
        console.log(data);
      };
      reader.readAsArrayBuffer(file);
    },
  },
};
</script>

<style>

</style>