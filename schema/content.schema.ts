import { dataAsset, p } from '@gameengine/schema';
export const AITuningDef = dataAsset('AITuningDef', {
  easyReaction: p.int('Fixed steps between easy CPU observations'), normalReaction: p.int(), hardReaction: p.int(),
  easyMistake: p.int('Chance in percent to miss a defensive decision'), normalMistake: p.int(), hardMistake: p.int(),
});
