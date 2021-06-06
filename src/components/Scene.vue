<template>
  <div>
    <div id="tf">
      <Chart :stat="stat" @change="onRSamplesChange"/>
      <p style="font-size: 10px;">Intensity-R Curve</p>
      <Chart :stat="stat" @change="onGSamplesChange"/>
      <p style="font-size: 10px;">Intensity-G Curve</p>
      <Chart :stat="stat" @change="onBSamplesChange"/>
      <p style="font-size: 10px;">Intensity-B Curve</p>
      <Chart :stat="stat" @change="onASamplesChange"/>
      <p style="font-size: 10px;">Intensity Correction Curve</p>
      <canvas class="tfVisual" ref="tfVisualRGB"></canvas>
      <p style="font-size: 10px;">Intensity-RGB Visual</p>
      <canvas class="tfVisual" ref="tfVisualA"></canvas>
      <p style="font-size: 10px;">Intensity Correction Visual</p>
    </div>
    <div>
      <canvas id="scene" ref="canvas"></canvas>
    </div>
  </div>
</template>

<script>
import * as dat from 'dat.gui';
import { RenderContext } from '@/render';
import { loadRaws } from '@/loader';
import Chart from '@/components/Chart';

const identicalTF = Float32Array.from([...Array(256).keys()].map(x => x / 255.0));

export default {
  name: 'Scene',
  components: {
    Chart,
  },
  computed: {
    stat() {
      return this.curr?.stat;
    }
  },
  data: () => ({
    gui: null,
    options: {
      data: 'teapot',
      background: 'black',
      raySampleNum: 512,
      raySamplesPerLightSample: 1,
      lightSampleNum: 8,
      light1Enable: false,
      light1X: 0,
      light1Y: 0,
      light1Z: -2,
      light1Intensity: 1,
      light2Enable: false,
      light2X: 0,
      light2Y: 2,
      light2Z: 0,
      light2Intensity: 1,
    },
    raws: null,
    curr: null,
    renderContext: null,
    samplesR: identicalTF,
    samplesG: identicalTF,
    samplesB: identicalTF,
    samplesA: identicalTF,
  }),
  mounted() {
    const vm = this;
    const renderContext = new RenderContext(this.$refs.canvas);

    this.gui = new dat.GUI();
    this.gui.add(this.options, 'data', ['teapot', 'engine', 'foot', 'lobster', 'skull'])
      .onFinishChange(() => {
        if (vm.raws) {
          vm.curr = vm.raws[vm.options.data];
          renderContext.setRaw(vm.curr);
        }
      });
    this.gui.add(this.options, 'background', ['black', 'white'])
      .onFinishChange(() => renderContext.setSceneBackground(vm.options.background));
    this.gui.add(this.options, 'raySampleNum', 1, 512, 1)
      .onFinishChange(() => renderContext.setOptions(vm.options));
    this.gui.add(this.options, 'raySamplesPerLightSample', 1, 64, 1)
      .onFinishChange(() => renderContext.setOptions(vm.options));
    this.gui.add(this.options, 'lightSampleNum', 1, 128, 1)
      .onFinishChange(() => renderContext.setOptions(vm.options));
    this.gui.add(this.options, 'light1Enable')
      .onFinishChange(() => renderContext.setLight1Enable(vm.options.light1Enable));
    this.gui.add(this.options, 'light1X')
      .onFinishChange(() => renderContext.setLight1Attr({ x: vm.options.light1X }));
    this.gui.add(this.options, 'light1Y')
      .onFinishChange(() => renderContext.setLight1Attr({ y: vm.options.light1Y }));
    this.gui.add(this.options, 'light1Z')
      .onFinishChange(() => renderContext.setLight1Attr({ z: vm.options.light1Z }));
    this.gui.add(this.options, 'light1Intensity', 0, 1)
      .onFinishChange(() => renderContext.setLight1Attr({ intensity: vm.options.light1Intensity }));
    this.gui.add(this.options, 'light2Enable')
      .onFinishChange(() => renderContext.setLight2Enable(vm.options.light2Enable));
    this.gui.add(this.options, 'light2X')
      .onFinishChange(() => renderContext.setLight2Attr({ x: vm.options.light2X }));
    this.gui.add(this.options, 'light2Y')
      .onFinishChange(() => renderContext.setLight2Attr({ y: vm.options.light2Y }));
    this.gui.add(this.options, 'light2Z')
      .onFinishChange(() => renderContext.setLight2Attr({ z: vm.options.light2Z }));
    this.gui.add(this.options, 'light2Intensity', 0, 1)
      .onFinishChange(() => renderContext.setLight2Attr({ intensity: vm.options.light2Intensity }));

    this.renderContext = renderContext;
    loadRaws(this);
    this.$on('rawLoaded', this.onRawLoaded);
  },
  methods: {
    onRawLoaded(raws) {
      this.raws = raws;
      this.curr = raws['teapot'];
      this.renderContext.init(this.curr, this.options);
    },
    onRSamplesChange(samples) {
      this.samplesR = samples;
      this.renderContext?.setTransferFunction({ r: samples });
      this.drawTF();
    },
    onGSamplesChange(samples) {
      this.samplesG = samples;
      this.renderContext?.setTransferFunction({ g: samples });
      this.drawTF();
    },
    onBSamplesChange(samples) {
      this.samplesB = samples;
      this.renderContext?.setTransferFunction({ b: samples });
      this.drawTF();
    },
    onASamplesChange(samples) {
      this.samplesA = samples;
      this.renderContext?.setTransferFunction({ a: samples });
      this.drawTF();
    },
    drawTF() {
      function componentToHex(c) {
        c = Math.round(c);
        c = Math.max(0, Math.min(255, c));
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
      }
      function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
      }
      const rgbCanvas = this.$refs.tfVisualRGB;
      const rgbCtx = rgbCanvas.getContext('2d');
      const rgbGrd = rgbCtx.createLinearGradient(0, rgbCanvas.height / 2, rgbCanvas.width - 1, rgbCanvas.height / 2);
      for (let i = 0; i <= 255; i++) {
        rgbGrd.addColorStop(i / 255.0, rgbToHex(this.samplesR[i] * 255, this.samplesG[i] * 255, this.samplesB[i] * 255));
      }
      rgbCtx.fillStyle = rgbGrd;
			rgbCtx.fillRect(0, 0, rgbCanvas.width - 1, rgbCanvas.height - 1);
      const aCanvas = this.$refs.tfVisualA;
      const aCtx = aCanvas.getContext('2d');
      const aGrd = aCtx.createLinearGradient(0, aCanvas.height / 2, aCanvas.width - 1, aCanvas.height / 2);
      for (let i = 0; i <= 255; i++) {
        aGrd.addColorStop(i / 255.0, rgbToHex(this.samplesA[i] * 255, this.samplesA[i] * 255, this.samplesA[i] * 255));
      }
      aCtx.fillStyle = aGrd;
			aCtx.fillRect(0, 0, aCanvas.width - 1, aCanvas.height - 1);
    },
  },
}
</script>

<style scoped>
#scene {
  width: 100%;
  height: 100%;
  position: fixed;
  left: 0;
}

#tf {
  position: fixed;
  left: 0;
  top: 200px;
  width: 350px;
  z-index: 100;
  opacity: 0.8;
  background: white;
}

.tfVisual {
  width: 80%;
  height: 20px;
  border: solid 1px rgba(0, 0, 0, 0.1);
}
</style>
