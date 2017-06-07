import * as d3shape from 'd3-shape';
import * as d3color from 'd3-color';
import * as d3transition from 'd3-transition';
import * as d3selection from 'd3-selection';
import * as d3scale from 'd3-scale';
import * as d3ease from 'd3-ease';
import * as d3drag from 'd3-drag';

let d3 = {};
Object.assign(d3, d3shape, d3color, d3transition, d3selection, d3scale, d3ease, d3drag);
export default d3;