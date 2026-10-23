import type { Region } from '../types';
import { eucalyptWoodland } from './eucalypt';
import { subtropicalRainforest } from './rainforest';
import { tropicalNorth } from './tropical';
import { coastalHeath } from './coastal';
import { outback } from './outback';
import { alpine } from './alpine';

/**
 * Australia — the default region.
 *
 * Seasons follow the southern-hemisphere calendar: wattle in late winter and early spring,
 * jacaranda and Christmas bush in late spring and summer, snow in the alpine biome from
 * about June to September, and the northern wet season from November to April.
 *
 * Every species here is native. No introduced animals and no northern-hemisphere
 * stand-ins — the brief was explicit, and it is also the whole point of the region system.
 */
export const australia: Region = {
  key: 'australia',
  label: 'Australia',
  note: 'Six biomes, from the red centre to the alpine high country.',
  hemisphere: 'south',
  defaultStages: ['young', 'juvenile', 'adult', 'elder'],

  seasons: {
    model: 'southern',
    months: [
      'summer', // Jan
      'summer', // Feb
      'autumn', // Mar
      'autumn', // Apr
      'autumn', // May
      'winter', // Jun
      'winter', // Jul
      'winter', // Aug
      'spring', // Sep
      'spring', // Oct
      'spring', // Nov
      'summer', // Dec
    ],
    notes: {
      summer: 'Hot and dry in the south, wet in the tropical north. Jacaranda and Christmas bush are out.',
      autumn: 'Cooling off. The wet season tails away in the north.',
      winter: 'Snow in the high country. Wattle starts to bloom.',
      spring: 'Wattle at its peak, then jacaranda towards the end.',
    },
  },

  backdrops: [
    {
      key: 'ranges',
      label: 'Blue ranges',
      note: 'Receding ridgelines going hazy blue with distance — the eucalypt oil haze that gives them the name.',
      sky: ['#6b9fd4', '#86b4de', '#a2c8e6', '#bdd7ea', '#d4e3ea', '#e6efe8'],
      far: '#8fa2c0',
      near: '#6e8a92',
      form: 'rolling',
    },
    {
      key: 'escarpment',
      label: 'Sandstone escarpment',
      note: 'A long red cliff line above the treetops, the way the interior breaks out of the plain.',
      sky: ['#7898c4', '#9aabc2', '#cebfa2', '#ebc48e', '#f5d69c', '#fae4b4'],
      far: '#a8745a',
      near: '#8a5a42',
      form: 'plateau',
    },
    {
      key: 'southern-night',
      label: 'Southern night',
      note: 'The Milky Way standing almost overhead, as it does from the southern half of the world.',
      sky: ['#05081a', '#0a1230', '#121d44', '#1a2856', '#243464', '#304274'],
      far: '#1c2644',
      near: '#15203c',
      night: true,
      form: 'rolling',
    },
  ],

  biomes: [eucalyptWoodland, subtropicalRainforest, tropicalNorth, coastalHeath, outback, alpine],
};
