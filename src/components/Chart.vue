<template>
  <div ref="editor" @input="onCurveChange"></div>
</template>

<script>
import { CurveEditor } from '@/curve/editor';

export default {
  name: 'Scene',
  props: {
    stat: Array,
  },
  data: () => ({
    editor: null,
  }),
  mounted() {
    this.editor = new CurveEditor(140, 320, this.$refs.editor);
    this.$emit('change', this.editor.sample(255));
  },
  watch: {
    stat(s) {
      this.editor.setStat(s);
    }
  },
  methods: {
    onCurveChange() {
      this.$emit('change', this.editor.sample(255));
    }
  }
}
</script>

<style>

</style>