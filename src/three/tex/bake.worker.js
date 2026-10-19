import * as recipes from '../materials/recipes.js';
import { bakeArrays } from './bake.js';

self.onmessage = ({ data: { key } }) => {
  const result = bakeArrays(recipes[key]);
  self.postMessage({ key, ...result }, [result.color.buffer, result.normals.buffer, result.rough.buffer]);
};
