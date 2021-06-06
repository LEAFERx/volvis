import * as d3 from 'd3';

const margin = ({top: 10, right: 20, bottom: 20, left: 30});

let uid = 0;

class Keyframe {
  constructor({ time, value, inTangent, outTangent }) {
    this.time = Math.max(0, Math.min(1, time)) || 0;
    this.value = value || 0;
    this.inTangent = inTangent || 0;
    this.outTangent = outTangent || 0;
    this.id = uid;
    uid += 1;
    this.inMagnitude = -0.1;
    this.outMagnitude = 0.1;
  }

  getHandles() {
    return { in: this.getInHandle(), out: this.getOutHandle() };
  }

  getInHandle() {
    return {
      x: this.time + this.inMagnitude,
      y: this.value + this.inMagnitude * this.inTangent,
    };
  }

  getOutHandle() {
    return {
      x: this.time + this.outMagnitude,
      y: this.value + this.outMagnitude * this.outTangent,
    };
  }

  setTangentsFromHandles(tangents) {
    this.setInTangentFromHandle(tangents.in.x, tangents.in.y);
    this.setOutTangentFromHandle(tangents.out.x, tangents.out.y);
  }

  setInTangentFromHandle(x, y) {
    if(x >= this.time) return;
    this.inMagnitude = x - this.time;
    this.inTangent = (y - this.value) / this.inMagnitude;
  }

  setOutTangentFromHandle(x, y) {
    if(x <= this.time) return;
    this.outMagnitude = x - this.time;
    this.outTangent = (y - this.value) / this.outMagnitude;
  }

  setInTangentFromHandleSync(x, y) {
    if(x >= this.time) return;
    this.inMagnitude = x - this.time;
    this.inTangent = (y - this.value) / this.inMagnitude;
    this.outMagnitude = -this.inMagnitude;
    this.outTangent = this.inTangent;
  }

  setOutTangentFromHandleSync(x, y) {
    if(x <= this.time) return;
    this.outMagnitude = x - this.time;
    this.outTangent = (y - this.value) / this.outMagnitude;
    this.inMagnitude = -this.outMagnitude;
    this.inTangent = this.outTangent;
  }
}

class Curve {
  constructor(keyframes) {
    const linearKeySet = [new Keyframe({ time: 0 }), new Keyframe({ time: 1 })];

    if (!keyframes || !Array.isArray(keyframes)) {
      this.keyframes = linearKeySet;
    } else {
      this.keyframes = keyframes;

      if (keyframes.length < 2)
        this.keyframes.concat(
          linearKeySet.splice(keyframes.length, 2 - keyframes.length)
        );
    }

    this.sortKeyframes();
  }

  addKey(keyframe) {
    this.addKeyframes([keyframe]);
  }

  removeKey(keyframe) {
    const foundIndex = this.keyframes.findIndex(
      kf => kf.time === keyframe.time
    );
    if (foundIndex > 0 && foundIndex < this.keyframes.length - 1)
      this.keyframes.splice(foundIndex, 1);
  }

  addKeyframes(keyframes) {
    keyframes.forEach(k => {
      const foundIndex = this.keyframes.findIndex(kf => kf.time === k.time);
      if (foundIndex === 0 || foundIndex === this.keyframes.length - 1) return;
      if (foundIndex >= 0) {
        this.keyframes[foundIndex] = k;
      } else this.keyframes.push(k);
    });

    this.sortKeyframes();
  }

  GetClosestKeyframes(t) {
    t = Math.max(0, Math.min(1, t));
    let lo = -1,
      hi = this.keyframes.length;
    while (hi - lo > 1) {
      let mid = Math.round((lo + hi) / 2);
      if (this.keyframes[mid].time <= t) lo = mid;
      else hi = mid;
    }
    if (this.keyframes[lo].time === t) hi = lo;
    if (lo === hi) {
      if (lo === 0) hi++;
      else lo--;
    }
    return [lo, hi];
  }

  evaluate(t) {
    return this.hermite(t, this.keyframes).y;
  }

  hermite(t, keyframes) {
    const n = keyframes.length;

    const lo = this.GetClosestKeyframes(t)[0];

    let i0 = lo;
    let i1 = i0 + 1;

    if (i0 > n - 1) throw new Error('Out of bounds');
    if (i0 === n - 1) i1 = i0;

    let scale = keyframes[i1].time - keyframes[i0].time;

    t = (t - keyframes[i0].time) / scale;

    let t2 = t * t;
    let it = 1 - t;
    let it2 = it * it;
    let tt = 2 * t;
    let h00 = (1 + tt) * it2;
    let h10 = t * it2;
    let h01 = t2 * (3 - tt);
    let h11 = t2 * (t - 1);
    
    const x =
      h00 * keyframes[i0].value +
      h10 * keyframes[i0].outTangent * scale +
      h01 * keyframes[i1].value +
      h11 * keyframes[i1].inTangent * scale;

    const y =
      h00 * keyframes[i0].value +
      h10 * keyframes[i0].outTangent * scale +
      h01 * keyframes[i1].value +
      h11 * keyframes[i1].inTangent * scale;

    return { x, y };
  }

  sortKeyframes() {
    this.keyframes.sort((a, b) => a.time - b.time);
    this.firstKeyframe = this.keyframes[0];
    this.lastKeyframe = this.keyframes[this.keyframes.length - 1];
  }

  move(keyframe, time, value, boundFirstLast) {
    const keyIndex = this.keyframes.indexOf(keyframe);

    if (keyIndex <= 0 || keyIndex >= this.keyframes.length - 1) {
      if (!boundFirstLast) {
        keyframe.value = Math.max(0, Math.min(value, 1));
      }
      return;
    }
    keyframe.value = Math.max(0, Math.min(value, 1));
    keyframe.time = Math.max(0.001, Math.min(time, 0.999));

    this.sortKeyframes();
  }

  copy() {
    return new Curve(
      this.keyframes.map(keyframe => {
        return new Keyframe({ ...keyframe });
      })
    );
  }
}

export class CurveEditor {
  constructor(height, width, div, defaultCurve) {
    this.height = height;
    this.width = width;

    const x = d3.scaleLinear().range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);
    x.clamp(true);
    y.clamp(true);
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom + 6})`)
      .call(d3.axisBottom(x.copy().interpolate(d3.interpolateRound)).ticks(10))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').clone()
        .attr('stroke-opacity', 0.1)
        .attr('y1', margin.bottom + margin.top - height - 12));
    const yAxis = g => g
      .attr('transform', `translate(${margin.left - 6},0)`)
      .call(d3.axisLeft(y.copy().interpolate(d3.interpolateRound)).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').clone()
        .attr('stroke-opacity', 0.1)
        .attr('x1', width - margin.left - margin.right + 12));
    this.x = x;
    this.y = y;

    this.div = div;
    this.defaultCurve = defaultCurve;
    if (defaultCurve !== undefined) {
      this.curve = defaultCurve.copy();
    } else {
      this.curve = new Curve([
        new Keyframe({ time: 0, value: 0, inTangent: 0, outTangent: 0 }),
        new Keyframe({ time: 1, value: 1, inTangent: 0, outTangent: 0 })
      ]);
    }
    const svg = d3
      .create('svg')
      .attr('cursor', 'pointer')
      .attr('viewBox', [0, 0, width, height])
      .style('max-width', `${width}px`)
      .style('overflow', 'visible');

    svg
      .append('g')
      .call(xAxis)
      .call(g =>
        g
          .append('text')
          .attr('x', width - margin.right)
          .attr('y', -3)
          .attr('fill', 'currentColor')
          .attr('font-weight', 'bold')
      );

    svg
      .append('g')
      .call(yAxis)
      .call(g =>
        g
          .select('.tick:last-of-type text')
          .clone()
          .attr('x', 3)
          .attr('text-anchor', 'start')
          .attr('font-weight', 'bold')
      );
    
    const gstat = svg
        .append('g')
        .attr('fill', '#eeeeee')
        // .attr('opacity', 0.5);

    const g = svg
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round');
    
    const editor = this;
  
    svg.on('click', function (event, _d) {
      if (event.defaultPrevented) return;
  
      editor.curve.addKey(
        new Keyframe({
          time: x.invert(d3.pointer(event, this)[0]),
          value: y.invert(d3.pointer(event, this)[1])
        })
      );
      editor.update();
      editor.updateValue();
    });
    
    this.svg = svg;
    this.gstat = gstat;
    this.g = g;

    this.update();

    this.div.appendChild(svg.node());
  }

  reset() {
    if (this.defaultCurve !== undefined) {
      this.curve = this.defaultCurve.copy();
    } else {
      this.curve = new Curve([
        new Keyframe({ time: 0, value: 0, inTangent: 0, outTangent: 0 }),
        new Keyframe({ time: 1, value: 1, inTangent: 0, outTangent: 0 })
      ]);
    }
    this.update();
    this.updateValue();
  }

  setStat(stat) {
    this.stat = stat;
    this.updateStat();
  }

  updateStat() {
    const max = Math.min(50000, d3.max(this.stat));
    const x = d3.scaleLinear()
      .domain([0, 256])
      .range([margin.left, this.width - margin.right]);
    const y = d3.scaleLinear()
      .domain([0, max]).nice()
      .range([this.height - margin.bottom, margin.top]);
    this.stat = this.stat.map(x => Math.min(y.domain()[1], x));
    this.gstat
      .selectAll('rect')
      .data(this.stat.entries())
      .join('rect')
        .attr('x', d => x(d[0]))
        .attr('width', d => Math.max(0, x(d[0] + 1) - x(d[0]) + 1))
        .attr('y', d => y(d[1]))
        .attr('height', d => y(0) - y(d[1]));
  }

  updateValue() {
    this.div.dispatchEvent(new CustomEvent('input'));
  }
  
  update() {
    const editor = this;
    const { x, y } = editor;
    const line = d3.line();
  
    this.g.selectAll('path')
      .data([t => Math.max(0, Math.min(editor.curve.evaluate(t), 1))])
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .transition()
      .duration(200)
      .attr('d', e => line(d3.ticks(0, 1, editor.width).map(t => [x(t), y(e(t))])));

    this.g.selectAll('.tangentesCont')
      .data(editor.curve.keyframes, (d, _i) => d.id)
      .join(enter =>
        enter
          .append('g')
          .attr('class', 'tangentesCont')
          .each(function(_d) {
            d3.select(this)
              .append('line')
              .attr('opacity', d => (d.id === editor.curve.firstKeyframe.id ? 0 : 1))
              .attr('class', 'inTangLine')
              .attr('fill', 'none')
              .attr('stroke', '#008ec4');

            d3.select(this)
              .append('line')
              .attr('class', 'outTangLine')
              .attr('opacity', d => (d.id === editor.curve.lastKeyframe.id ? 0 : 1))
              .attr('fill', 'none')
              .attr('stroke', '#008ec4');

            d3.select(this)
              .append('circle')
              .attr('stroke', 'black')
              .attr('opacity', d => (d.id === editor.curve.firstKeyframe.id ? 0 : 1))
              .attr('class', 'inTangKey')
              .attr('stroke', '#008ec4')
              .attr('fill', '#008ec4')
              .attr('r', 5)
              .attr('cursor', 'move')
              .call(
                d3
                  .drag()
                  .on('start', dragstartedKey)
                  .on('drag', draggedTangIn)
                  .on('end', dragendedKey)
              );

            d3.select(this)
              .append('circle')
              .attr('stroke', 'black')
              .attr('opacity', d => (d.id === editor.curve.lastKeyframe.id ? 0 : 1))
              .attr('class', 'outTangKey')
              .attr('stroke', '#008ec4')
              .attr('fill', '#008ec4')
              .attr('r', 5)
              .attr('cursor', 'move')
              .call(
                d3
                  .drag()
                  .on('start', dragstartedKey)
                  .on('drag', draggedTangOut)
                  .on('end', dragendedKey)
              );

            d3.select(this)
              .append('circle')
              .attr('class', 'keyframe')
              .attr('stroke', 'black')
              .attr('fill', 'white')
              .attr('r', 5)
              .attr('cursor', 'move')
              .on('contextmenu', (event, d) => {
                event.preventDefault();
                editor.curve.removeKey(d);
                editor.update();
                editor.updateValue();
              })
              .call(
                d3
                  .drag()
                  .on('start', dragstartedKey)
                  .on('drag', draggedKey)
                  .on('end', dragendedKey)
              );
          })
      )
      .each(function(d) {
        d3.select(this)
          .select('.keyframe')
          .attr('cx', x(d.time))
          .attr('cy', y(d.value))
          .attr('cursor', 'move');

        d3.select(this)
          .select('.inTangKey')
          .attr('cx', x(d.getHandles().in.x))
          .attr('cy', y(d.getHandles().in.y))
          .attr('cursor', 'move');

        d3.select(this)
          .select('.outTangKey')
          .attr('cx', x(d.getHandles().out.x))
          .attr('cy', y(d.getHandles().out.y));

        d3.select(this)
          .select('.inTangLine')
          .attr('stroke-width', '1')
          .attr('x1', x(d.getHandles().in.x))
          .attr('y1', y(d.getHandles().in.y))
          .attr('x2', x(d.time))
          .attr('y2', y(d.value));

        d3.select(this)
          .select('.outTangLine')
          .attr('stroke-width', '1')
          .attr('x1', x(d.time))
          .attr('y1', y(d.value))
          .attr('x2', x(d.getHandles().out.x))
          .attr('y2', y(d.getHandles().out.y));
      });

    function dragstartedKey(_event, _d, _i) {
      d3.select(this)
        .raise()
        .attr('r', 6);
    }
  
    function draggedKey(event, d) {
      editor.curve.move(
        d,
        x.invert(d3.pointer(event, this)[0]),
        y.invert(d3.pointer(event, this)[1]),
        false,
      );
      editor.update();
    }
  
    function dragendedKey(_event, _d, _i) {
      d3.select(this)
        .raise()
        .attr('r', 5);

      editor.update();
      editor.updateValue();
    }
  
    function draggedTangIn(event, d) {
      if (event.sourceEvent.shiftKey) {
        d.setInTangentFromHandleSync(
          x.invert(d3.pointer(event, this)[0]),
          y.invert(d3.pointer(event, this)[1])
        );
      } else {
        d.setInTangentFromHandle(
          x.invert(d3.pointer(event, this)[0]),
          y.invert(d3.pointer(event, this)[1])
        );
      }
      editor.update();
    }
  
    function draggedTangOut(event, d) {
      if (event.sourceEvent.shiftKey) {
        d.setOutTangentFromHandleSync(
          x.invert(d3.pointer(event, this)[0]),
          y.invert(d3.pointer(event, this)[1])
        );
      } else {
        d.setOutTangentFromHandle(
          x.invert(d3.pointer(event, this)[0]),
          y.invert(d3.pointer(event, this)[1])
        );
      }
      editor.update();
    }
  }

  evaluate(t) {
    return this.curve.evaluate(t);
  }

  sample(times) {
    const samples = [];
    for (let i = 0.0; i <= times; i += 1) {
      samples.push(this.evaluate(i / times));
    }
    return Float32Array.from(samples);
  }
}
