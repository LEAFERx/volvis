<template>
  <div id="app">
    <Scene />
    <!-- <Upload /> -->
  </div>
</template>

<script>
import Scene from './components/Scene'
// import Upload from './components/Upload'

export default {
  name: 'App',
  components: {
    Scene,
    // Upload,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
