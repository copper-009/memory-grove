import type { Region } from '../types';
import { gbif, iucn } from '../sources';

/**
 * Norway — taiga forest, and the fjord coast and mountain plateau tundra.
 *
 * **Musk oxen are deliberately excluded.** Norway's only wild herd, at Dovrefjell, was
 * introduced from Greenland in several attempts between 1932 and 1953 — the species died
 * out in mainland Europe at the end of the last Ice Age. The brief asks for native species
 * only, so musk ox is left out here even though it is the animal most associated with that
 * particular plateau today. See `reference/SPECIES.md`.
 *
 * Light follows the real far-north pattern: a golden midnight-sun glow through midsummer
 * (the renderer's "day" look is stretched later into the evening above the Arctic Circle)
 * and a long blue polar twilight through midwinter, handled as an extended dusk/dawn theme
 * in `src/forest/theme.ts` rather than a true night during that period.
 */
export const norway: Region = {
  key: 'norway',
  label: 'Norway',
  note: 'Pine and spruce taiga, and the fjord coast rising to a windswept plateau.',
  hemisphere: 'north',
  defaultStages: ['kalv', 'juvenile', 'adult', 'elder'],
  excludedSpecies: [
    {
      common: 'Muskox',
      scientific: 'Ovibos moschatus',
      reason:
        'Associated with the Dovrefjell plateau today, but the mainland European population ' +
        'died out at the end of the last Ice Age. Norway\'s only wild herd was introduced from ' +
        'Greenland in several attempts between 1932 and 1953. Not native, so left out.',
    },
  ],

  seasons: {
    model: 'northern',
    months: [
      'polarNight', 'winter', 'spring', 'spring', 'spring', 'midnightSun',
      'midnightSun', 'summer', 'autumn', 'autumn', 'winter', 'polarNight',
    ],
    notes: {
      spring: 'Snowmelt floods the rivers; migratory birds return to the coast.',
      midnightSun: 'The sun barely sets in the north; a long golden evening light all through the night.',
      autumn: 'Rowan berries turn red and cloudberries ripen on the plateau.',
      polarNight: 'The sun stays below the horizon in the far north; aurora on clear nights.',
    },
  },

  backdrops: [
    {
      key: 'fjord-waterfall',
      label: 'Fjord with a waterfall',
      note: 'Steep fjord walls, a thread of waterfall, pine clinging to the lower slopes.',
      sky: ['#5f87b8', '#82a0c6', '#a6bcd6', '#c7d6e2', '#dde6e4', '#eef2ec'],
      far: '#5a7088',
      near: '#3a5060',
      form: 'fjord',
    },
    {
      key: 'snowy-plateau',
      label: 'Snowy plateau',
      note: 'A wide white tableland under a pale winter sky, scattered rock showing through.',
      sky: ['#7aa0c8', '#9ab2d0', '#bcc8da', '#d8d8de', '#e8e4e2', '#f4f0ec'],
      far: '#c0c6d0',
      near: '#8a94a0',
      form: 'plateau',
    },
    {
      key: 'aurora-mountains',
      label: 'Aurora over the mountains',
      note: 'Pale green curtains of aurora moving above a dark jagged skyline.',
      sky: ['#040810', '#081426', '#101e36', '#182a46', '#223656', '#2e4466'],
      far: '#162030',
      near: '#0e1826',
      night: true,
      form: 'peaks',
      // Matches the season notes above ("aurora on clear nights" under polarNight) -
      // this is when it actually appears, rather than every clear night year-round.
      season: ['polarNight', 'winter'],
    },
    {
      key: 'clear-mountains-night',
      label: 'Clear night over the mountains',
      note: 'A plain, star-clear night sky above a dark jagged skyline, no aurora.',
      sky: ['#060a16', '#0b1326', '#131f38', '#1b2b4a', '#25375c', '#30446e'],
      far: '#182236',
      near: '#101a2a',
      night: true,
      form: 'peaks',
    },
  ],

  biomes: [
    {
      key: 'taiga',
      label: 'Taiga forest',
      note: 'Pine, spruce and birch, with rowan berries turning red in autumn.',
      landform: 'rolling',
      ground: ['#2e3e28', '#20301e', '#3c523a'],
      ambience: ['mist', 'snow'],
      plants: [
        { key: 'scots-pine', common: 'Scots pine', scientific: 'Pinus sylvestris',
          form: 'conifer', traits: ['Reddish flaking bark on the upper trunk', 'Flattened, irregular crown on older trees'],
          iucn: 'LC', fact: 'The bark turns a distinctive warm orange-red high on the trunk, where it is thinnest and most recently shed.',
          source: gbif('Pinus sylvestris'),
          crown: ['#14241c', '#1e3628', '#2a4a34', '#3b6044', '#537c58'], bark: ['#a86a44', '#7a4a2e', '#4e2e1c'], ailing: 'bare', spread: 0.75 },
        { key: 'norway-spruce', common: 'Norway spruce', scientific: 'Picea abies',
          form: 'conifer', traits: ['Drooping lower branches with hanging cones', 'Tall straight symmetrical spire'],
          iucn: 'LC', fact: 'One of the oldest-known living trees on Earth is a Norway spruce clone in the Swedish mountains, estimated at over nine thousand years.',
          source: gbif('Picea abies'),
          crown: ['#101f17', '#1a3024', '#24432e', '#33583c', '#48724e'], bark: ['#6a5a48', '#473c30', '#2c251c'], ailing: 'bare', spread: 0.7 },
        { key: 'downy-birch', common: 'Downy birch', scientific: 'Betula pubescens',
          form: 'broadleaf', traits: ['Pale grey-brown bark, less papery than silver birch', 'Soft downy young twigs'],
          iucn: 'LC', fact: 'Hardier than silver birch and the one that reaches furthest north and highest up the mountainside.',
          source: gbif('Betula pubescens'),
          crown: ['#2c3a24', '#3c5030', '#4f683e', '#678250', '#86a068'], bark: ['#d8d0c0', '#ada290', '#7a7062'], ailing: 'bare', spread: 0.9 },
        { key: 'rowan', common: 'Rowan', scientific: 'Sorbus aucuparia',
          form: 'broadleaf', traits: ['Clusters of bright red berries in autumn', 'Delicate feathery leaves'],
          iucn: 'LC', fact: 'Its berries turn a vivid red in autumn and are stripped quickly by thrushes and waxwings.',
          source: gbif('Sorbus aucuparia'),
          crown: ['#243222', '#33462c', '#455c3a', '#5b764c', '#c0302a'], bark: ['#7a7058', '#564e3c', '#342f24'], ailing: 'autumn', spread: 0.85 },
      ],
      creatures: [
        { key: 'elg', slot: 0, common: 'Elk', scientific: 'Alces alces', localName: 'elg', localLanguage: 'Norwegian',
          traits: ['Broad palmate antlers on males', 'A heavy dewlap under the chin'],
          iucn: 'LC', fact: "Norway's most hunted big game animal, and the taiga's largest herbivore by far.",
          source: iucn('Alces alces'), activity: 'crepuscular', zone: 'ground', stages: ['kalv', 'juvenile', 'adult', 'elder'],
          behaviour: 'Browses birch twigs at the forest edge, head lifting often to listen.',
          body: { kind: 'quadruped', size: [14, 11], legs: 5, neck: 3, crest: 5, tail: { len: 1, style: 'none' } },
          palette: { b: '#3a2e22', d: '#201812', l: '#5c4a38', e: '#0a0806', n: '#8a7a60' } },
        { key: 'ekorn', slot: 1, common: 'Red squirrel', scientific: 'Sciurus vulgaris', localName: 'ekorn', localLanguage: 'Norwegian',
          traits: ['Rust-red coat, paler in winter', 'Tufted ears in winter coat'],
          iucn: 'LC', fact: 'Buries cones and seeds across a wide area each autumn and relies on scent, not memory, to find them again.',
          source: iucn('Sciurus vulgaris'), activity: 'diurnal', zone: 'trunk', stages: ['kit', 'juvenile', 'adult', 'elder'],
          behaviour: 'Darts up a trunk in short bursts, pausing flat against the bark.',
          body: { kind: 'quadruped', size: [6, 4], legs: 2, ears: 2, tail: { len: 6, style: 'bush' } },
          palette: { b: '#a8502a', d: '#6a3018', l: '#d08050', e: '#120c06', n: '#f0e8dc' } },
        { key: 'gaupe', slot: 2, common: 'Eurasian lynx', scientific: 'Lynx lynx',
          traits: ['Tufted black ear-tips', 'Short bobbed tail and a ruffed face'],
          iucn: 'LC', national: 'Endangered on the Norwegian Red List',
          fact: 'Globally secure, but closely managed in Norway, where it is hunted under an annual quota.',
          source: iucn('Lynx lynx'), activity: 'nocturnal', zone: 'ground', stages: ['kitten', 'juvenile', 'adult', 'elder'],
          behaviour: 'Moves without a sound along the treeline, pausing to listen.',
          body: { kind: 'quadruped', size: [11, 8], legs: 3, tail: { len: 2, style: 'down' }, ears: 3 },
          palette: { b: '#b0a080', d: '#7a6c50', l: '#d4c6a4', e: '#120e08', n: '#1a1814' } },
        { key: 'jerv', slot: 3, common: 'Wolverine', scientific: 'Gulo gulo', localName: 'jerv', localLanguage: 'Norwegian',
          traits: ['Dark shaggy body with pale flank stripes', 'A powerful, stocky build for its size'],
          iucn: 'LC', national: 'Endangered on the Norwegian Red List',
          fact: 'Ranges over enormous distances for its size and can bring down prey many times its own weight.',
          source: iucn('Gulo gulo'), activity: 'nocturnal', zone: 'ground', stages: ['kit', 'juvenile', 'adult', 'elder'],
          behaviour: 'Moves in a loping run across open ground, covering distance fast.',
          body: { kind: 'quadruped', size: [9, 5], legs: 2, tail: { len: 4, style: 'bush' }, ears: 1 },
          palette: { b: '#3e3024', d: '#201810', l: '#5c4a38', e: '#0a0806', n: '#8a6a48' } },
        { key: 'storfugl', slot: 4, common: 'Western capercaillie', scientific: 'Tetrao urogallus', localName: 'storfugl', localLanguage: 'Norwegian',
          traits: ['Huge dark body, fanned black tail on the male', 'A red wattle over the eye'],
          iucn: 'LC', fact: 'The male performs a loud, strange popping display at dawn gatherings each spring.',
          source: iucn('Tetrao urogallus'), activity: 'diurnal', zone: 'ground', stages: ['chick', 'juvenile', 'adult', 'elder'],
          flourish: 'display', behaviour: 'Struts with its tail fanned, wings dropped, at the forest edge.',
          body: { kind: 'bird', size: [10, 9], beak: 2, tail: { len: 6, style: 'fan' }, legs: 2 },
          palette: { b: '#1a1a1c', d: '#0a0a0c', l: '#3a3a3e', e: '#c0302a', w: '#8a8470' },
          alt: { zone: 'sky', sprite: { pal: { d: '#0a0a0c', b: '#1a1a1c', h: '#8a8470', y: '#c0302a' }, frames: [
            ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
            ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
          ] as const } } },
      ],
      understory: [
        { key: 'lingonberry', label: 'Lingonberry', what: 'Low berry shrubs across the forest floor', colour: '#4a6a3c' },
        { key: 'cloudberry', label: 'Cloudberry', what: 'Amber berries on the bog edge in late summer', colour: '#e0a040' },
        { key: 'reindeer-lichen', label: 'Reindeer lichen', what: 'Pale lichen carpeting the ground', colour: '#a8ac98' },
      ],
    },
    {
      key: 'fjord-plateau',
      hasWater: true,
      label: 'Fjord coast and plateau',
      note: 'Steep fjord walls below, a wide windswept tundra plateau above.',
      landform: 'fjord',
      ground: ['#8a9078', '#6a7258', '#9ca488'],
      ambience: ['snow', 'mist'],
      plants: [
        { key: 'heather', common: 'Heather', scientific: 'Calluna vulgaris', localName: 'lyng', localLanguage: 'Norwegian',
          form: 'shrub', traits: ['Dense low wiry mat', 'Small purple-pink flowers in late summer'],
          iucn: 'LC', fact: 'Covers vast stretches of the coastal moor and turns a deep purple in late summer.',
          source: gbif('Calluna vulgaris'),
          crown: ['#2e2a34', '#3e3844', '#524854', '#6a5c68', '#9a6a94'], bark: ['#4a4038', '#342c26', '#201c18'], ailing: 'dry', spread: 0.55 },
        { key: 'dwarf-birch', common: 'Dwarf birch', scientific: 'Betula nana',
          form: 'shrub', traits: ['Tiny rounded serrated leaves', 'A low creeping tangle, barely knee-high'],
          iucn: 'LC', fact: 'Grows so low that in a hard winter the whole plant disappears entirely under the snow.',
          source: gbif('Betula nana'),
          crown: ['#2a3a24', '#3a4e30', '#4d663e', '#648050', '#c0302a'], bark: ['#5a5244', '#403a30', '#28241c'], ailing: 'autumn', spread: 0.5 },
      ],
      creatures: [
        { key: 'fjellrev', slot: 0, common: 'Arctic fox', scientific: 'Vulpes lagopus', localName: 'fjellrev', localLanguage: 'Norwegian',
          traits: ['Pure white winter coat, brown-grey in summer', 'Thick fur even on the soles of its feet'],
          iucn: 'LC', national: 'Critically Endangered on the Norwegian Red List, with active recovery programmes',
          fact: 'One of Norway’s rarest mammals despite being secure globally — the mainland population fell drastically through the twentieth century.',
          source: iucn('Vulpes lagopus'), activity: 'cathemeral', zone: 'slope', stages: ['kit', 'juvenile', 'adult', 'elder'],
          behaviour: 'Trots across the snow, pausing to listen for movement beneath it.',
          body: { kind: 'quadruped', size: [8, 4], legs: 2, tail: { len: 5, style: 'bush' }, ears: 2 },
          palette: { b: '#f0ece4', d: '#c8c0b0', l: '#ffffff', e: '#120e08', n: '#8a8270' } },
        { key: 'reinsdyr', slot: 1, common: 'Wild reindeer', scientific: 'Rangifer tarandus', localName: 'reinsdyr', localLanguage: 'Norwegian',
          traits: ['Branching antlers on both sexes', 'Thick pale-brown winter coat'],
          iucn: 'VU', fact: 'Norway holds some of the last truly wild mountain reindeer herds left in Europe.',
          source: iucn('Rangifer tarandus'), activity: 'diurnal', zone: 'slope', stages: ['kalv', 'juvenile', 'adult', 'elder'],
          behaviour: 'Moves in a loose herd across the plateau, pawing through snow for lichen.',
          body: { kind: 'quadruped', size: [11, 9], legs: 4, crest: 5, tail: { len: 2, style: 'down' } },
          palette: { b: '#9a8468', d: '#6a5844', l: '#c0a888', e: '#120e08', n: '#f0e8d8' } },
        { key: 'havorn', slot: 2, common: 'White-tailed eagle', scientific: 'Haliaeetus albicilla', localName: 'havørn', localLanguage: 'Norwegian',
          traits: ['Enormous broad wings and a short white wedge tail', 'A heavy pale yellow bill'],
          iucn: 'LC', fact: 'The largest eagle in Europe, and Norway’s coast and fjords hold one of the healthiest populations anywhere.',
          source: iucn('Haliaeetus albicilla'), activity: 'diurnal', zone: 'sky', stages: ['chick', 'fledgling', 'adult', 'elder'],
          flourish: 'soar', behaviour: 'Glides low along the fjord wall, then rises on the updraught.',
          body: { kind: 'flyer', size: [16, 6], tail: { len: 3, style: 'fan' }, beak: 3 },
          palette: { d: '#4a4438', b: '#5e5648', g: '#2a2620', y: '#d8c060', w: '#f0ece0' } },
        { key: 'lunde', slot: 3, common: 'Atlantic puffin', scientific: 'Fratercula arctica', localName: 'lunde', localLanguage: 'Norwegian',
          traits: ['Brightly striped orange-and-grey bill, in summer only', 'Black back, white face and underside'],
          iucn: 'VU', fact: 'Nests in burrows on sea cliffs through summer, then spends the rest of the year far out at sea, bill faded to a duller colour.',
          source: iucn('Fratercula arctica'), activity: 'diurnal', zone: 'waterEdge', stages: ['chick', 'juvenile', 'adult', 'elder'],
          behaviour: 'Stands at a burrow mouth on the cliff, then launches out over the water.',
          body: { kind: 'bird', size: [6, 5], beak: 3, legs: 1, tail: { len: 1, style: 'none' } },
          palette: { b: '#1a1a1c', d: '#0a0a0c', l: '#f0ece0', e: '#120e08', y: '#e8a030', r: '#c0302a' },
          alt: { zone: 'sky', sprite: { pal: { d: '#0a0a0c', b: '#1a1a1c', h: '#f0ece0', y: '#e8a030' }, frames: [
            ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
            ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
          ] as const } } },
        { key: 'kongeorn', slot: 4, common: 'Golden eagle', scientific: 'Aquila chrysaetos',
          traits: ['Golden-brown nape', 'Broad dark wings held in a slight dihedral'],
          iucn: 'LC', fact: 'Patrols the open plateau for ptarmigan and hare, soaring for long stretches without a wingbeat.',
          source: iucn('Aquila chrysaetos'), activity: 'diurnal', zone: 'sky', stages: ['chick', 'fledgling', 'adult', 'elder'],
          flourish: 'soar', behaviour: 'Circles very high over the tundra, barely moving its wings.',
          body: { kind: 'flyer', size: [15, 5], tail: { len: 4, style: 'fan' }, beak: 2 },
          palette: { d: '#2a2018', b: '#44352a', g: '#1a1410', y: '#8a6a3a' } },
      ],
      understory: [
        { key: 'bearberry', label: 'Bearberry', what: 'Trailing berries across the rock', colour: '#6a8450' },
        { key: 'moss-no', label: 'Mountain moss', what: 'Moss filling every damp hollow', colour: '#5a7a44' },
        { key: 'rock-no', label: 'Weathered rock', what: 'Bare rock scoured by wind and ice', colour: '#8a8a7e' },
      ],
    },
  ],
};
