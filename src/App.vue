<template>
  <div id="app">
    <Scene />
  </div>
</template>

<script>
import Scene from './components/Scene'

export default {
  name: 'App',
  components: {
    Scene,
  },
};
</script>

<style>
body {
  margin: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
