import teapot from '@/assets/BostonTeapot.raw';
import teapotInfo from '@/assets/BostonTeapot.raw.info';
import engine from '@/assets/engine.raw';
import engineInfo from '@/assets/engine.raw.info';
import foot from '@/assets/foot.raw';
import footInfo from '@/assets/foot.raw.info';
import lobster from '@/assets/lobster.raw';
import lobsterInfo from '@/assets/lobster.raw.info';
import skull from '@/assets/skull.raw';
import skullInfo from '@/assets/skull.raw.info';

async function getFile(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const data = Float32Array.from(new Uint8Array(buffer));
  return data;
}

function parseInfo(info) {
  info = info.split(/[ \t\n]+/);
  return {
    dimension: [info[1], info[2], info[3]].map(x => parseFloat(x)),
    interval: [info[4], info[5], info[6]].map(x => parseFloat(x)),
  };
}

function generateStat(data) {
  const stat = new Array(256).fill(0);
  data.forEach(v => stat[Math.floor(v)] += 1);
  return stat;
}

async function loadRaw(rawUrl, info) {
  const data = await getFile(rawUrl);
  return {
    data,
    info: parseInfo(info),
    stat: generateStat(data),
  };
}

export async function loadRaws(vm) {
  const raws = {};
  raws['teapot'] = await loadRaw(teapot, teapotInfo);
  raws['engine'] = await loadRaw(engine, engineInfo);
  raws['foot'] = await loadRaw(foot, footInfo);
  raws['lobster'] = await loadRaw(lobster, lobsterInfo);
  raws['skull'] = await loadRaw(skull, skullInfo);
  vm.$emit('rawLoaded', raws);
}