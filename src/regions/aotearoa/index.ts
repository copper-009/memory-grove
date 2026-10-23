import type { Region } from '../types';
import { gbif, iucn, nzbirds } from '../sources';

/**
 * Aotearoa New Zealand.
 *
 * Te reo Māori names are given alongside English, with macrons intact — tūī, kererū,
 * kārearea, takahē, pīwauwau, roroa. They are the names actually used in New Zealand and
 * the tooltip shows both.
 *
 * On the brief's species list: Archey's frog (*Leiopelma archeyi*, Critically Endangered) is
 * a Coromandel and Whareorino **forest** species, not an alpine one, so it is documented in
 * `reference/SPECIES.md` under the forest biome but is not one of that biome's five unlocks —
 * there were six good candidates for five slots. Nothing has been placed in a habitat it
 * does not occur in.
 */
export const aotearoa: Region = {
  key: 'aotearoa',
  label: 'Aotearoa New Zealand',
  note: 'Kauri and podocarp forest, and the tussock country of the Southern Alps.',
  hemisphere: 'south',
  defaultStages: ['chick', 'juvenile', 'adult', 'elder'],

  seasons: {
    model: 'southern',
    months: [
      'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter',
      'winter', 'winter', 'spring', 'spring', 'spring', 'summer',
    ],
    notes: {
      summer: 'Long days. Rātā flowers red in the forest canopy.',
      autumn: 'Beech forest turns; the first snow dusts the tops.',
      winter: 'Deep snow in the Alps. The bush stays green — almost nothing here is deciduous.',
      spring: 'Mount Cook lilies out on the scree once the snow retreats.',
    },
  },

  backdrops: [
    {
      key: 'fiord',
      label: 'Fiord',
      note: 'Sheer walls dropping straight into dark water, with a waterfall thread down one face.',
      sky: ['#6e8296', '#8296a8', '#9aaab8', '#b2bfc8', '#c8d2d6', '#dce2e2'],
      far: '#4a5c66',
      near: '#2e3e46',
      form: 'fjord',
    },
    {
      key: 'snowy-peaks',
      label: 'Southern Alps',
      note: 'A hard white skyline of snow and rock above golden tussock.',
      sky: ['#5f8fc4', '#7fa5d0', '#9dbbdc', '#bcd0e4', '#d6e0e8', '#eaeee8'],
      far: '#c8d4e0',
      near: '#7e8c90',
      form: 'peaks',
    },
    {
      key: 'misty-bush-night',
      label: 'Misty bush at night',
      note: 'Low cloud caught in the canopy, and the Southern Cross above it.',
      sky: ['#060a16', '#0c142c', '#141f3e', '#1c2a4e', '#26365c', '#32446c'],
      far: '#1a2838',
      near: '#121e2a',
      night: true,
      form: 'canopy',
    },
  ],

  biomes: [
    {
      key: 'kauri-forest',
      label: 'Kauri and podocarp forest',
      note: 'Massive kauri trunks, tree ferns beneath, and birdsong all through it.',
      ground: ['#3a4a34', '#2b3a28', '#47603c'],
      ambience: ['mist', 'glowworms'],
      plants: [
        {
          key: 'kauri', common: 'Kauri', scientific: 'Agathis australis', localName: 'kauri', localLanguage: 'te reo Māori',
          form: 'conifer', traits: ['Enormous smooth grey columnar trunk, free of branches for most of its height', 'Crown of small leathery leaves high above'],
          iucn: 'NE', national: 'Threatened by kauri dieback (Phytophthora agathidicida); tracks through kauri forest are managed to limit its spread',
          fact: 'Among the longest-lived trees anywhere — the largest, Tāne Mahuta, is thought to be well over a thousand years old.',
          source: gbif('Agathis australis'),
          crown: ['#1c3024', '#28452e', '#375c3a', '#4b7648', '#6a9460'], bark: ['#9a948a', '#716c62', '#4a463e'], ailing: 'bare', spread: 1.2,
        },
        {
          key: 'rimu', common: 'Rimu', scientific: 'Dacrydium cupressinum', localName: 'rimu', localLanguage: 'te reo Māori',
          form: 'conifer', traits: ['Weeping curtain-like foliage', 'Tall narrow crown emerging above the canopy'],
          iucn: 'LC', fact: 'A podocarp, not a pine. Young trees weep so heavily they look like green waterfalls.',
          source: gbif('Dacrydium cupressinum'),
          crown: ['#18291e', '#223c28', '#2f5232', '#406a40', '#5c8856'], bark: ['#6a5a4a', '#4a3e34', '#2c2520'], ailing: 'bare', spread: 0.85,
        },
        {
          key: 'ponga', common: 'Silver fern', scientific: 'Alsophila dealbata', localName: 'ponga', localLanguage: 'te reo Māori',
          form: 'fern', traits: ['Underside of the fronds is silver-white', 'Unfurling koru at the crown'],
          iucn: 'NE', fact: 'The silver underside shows up in moonlight, and was used to mark tracks through the bush at night.',
          source: gbif('Alsophila dealbata'),
          crown: ['#1e3422', '#2a4a2c', '#3a6238', '#4e7c48', '#8aa882'], bark: ['#6e6252', '#4e453a', '#302a24'], ailing: 'dry', spread: 1.15,
        },
        {
          key: 'harakeke', common: 'New Zealand flax', scientific: 'Phormium tenax', localName: 'harakeke', localLanguage: 'te reo Māori',
          form: 'columnar', traits: ['Stiff upright fans of long strap leaves', 'Tall dark flower stalks well above the leaves'],
          iucn: 'LC', fact: 'Tūī and bellbirds feed on the nectar, and the flower stalks stand far above everything around them.',
          source: gbif('Phormium tenax'),
          crown: ['#243a24', '#2f4e2c', '#3e6436', '#527c44', '#6e9a5a'], bark: ['#5a5440', '#403c2e', '#2a2720'], ailing: 'dry', spread: 0.75,
        },
      ],
      creatures: [
        {
          key: 'tui', slot: 0, common: 'Tūī', scientific: 'Prosthemadera novaeseelandiae', localName: 'tūī', localLanguage: 'te reo Māori',
          traits: ['Two white throat tufts against glossy blue-black', 'Iridescent green and bronze sheen in good light'],
          iucn: 'LC', fact: 'Has two voiceboxes and sings notes outside human hearing, so there are gaps in its song where something is happening you cannot hear.',
          source: nzbirds('tui'),
          activity: 'diurnal', zone: 'canopy', stages: ['chick', 'fledgling', 'adult', 'elder'],
          behaviour: 'Hangs upside down at flax flowers, then clatters off noisily between trees.',
          body: { kind: 'bird', size: [8, 6], beak: 3, tail: { len: 4, style: 'down' }, legs: 1 },
          palette: { b: '#16202a', d: '#0a1016', l: '#2c4a40', e: '#f4f2ec', w: '#1c5a4a', y: '#2a2a2a' },
        },
        {
          key: 'kereru', slot: 1, common: 'New Zealand pigeon', scientific: 'Hemiphaga novaeseelandiae', localName: 'kererū', localLanguage: 'te reo Māori',
          traits: ['Big, heavy, iridescent green-bronze above', 'Crisp white waistcoat below'],
          iucn: 'LC', fact: 'The only bird left big enough to swallow the largest native fruits whole, so several forest trees depend on it entirely.',
          source: nzbirds('new-zealand-pigeon'),
          activity: 'diurnal', zone: 'canopy', stages: ['chick', 'fledgling', 'adult', 'elder'],
          behaviour: 'Sits heavily on a branch eating leaves, and takes off with a loud whoomp of wings.',
          body: { kind: 'bird', size: [9, 7], beak: 2, tail: { len: 4, style: 'down' }, legs: 1 },
          palette: { b: '#2e4a44', d: '#1a2e2a', l: '#4a6e5e', e: '#f2f0ea', w: '#8a2a3a', y: '#c03030' },
        },
        {
          key: 'wetapunga', slot: 2, common: 'Giant wētā', scientific: 'Deinacrida heteracantha', localName: 'wētāpunga', localLanguage: 'te reo Māori',
          traits: ['Very heavy armoured brown body', 'Long spined hind legs and long antennae'],
          iucn: 'VU', fact: 'One of the heaviest insects in the world. Its name means roughly "god of ugly things", which is unkind of us.',
          source: iucn('Deinacrida heteracantha'),
          activity: 'nocturnal', zone: 'trunk', stages: ['nymph', 'juvenile', 'adult', 'old'],
          behaviour: 'Clings to bark after dark, antennae sweeping slowly.',
          body: { kind: 'reptile', size: [8, 4], legs: 2, tail: { len: 3, style: 'up' }, spines: true },
          palette: { b: '#6a5436', d: '#3e2f1c', l: '#9a8050', e: '#120c06', y: '#c0a060' },
        },
        {
          key: 'tuatara', slot: 3, common: 'Tuatara', scientific: 'Sphenodon punctatus', localName: 'tuatara', localLanguage: 'te reo Māori',
          traits: ['A crest of soft white spines along the back', 'Heavy head, loose olive-grey skin'],
          iucn: 'LC', national: 'Protected; restricted largely to predator-free offshore islands and fenced sanctuaries',
          fact: 'Not a lizard at all — the last survivor of an order that otherwise died out with the dinosaurs. It can live past a hundred.',
          source: iucn('Sphenodon punctatus'),
          activity: 'nocturnal', zone: 'ground', stages: ['hatchling', 'juvenile', 'adult', 'old'],
          behaviour: 'Sits at the mouth of a burrow almost perfectly still, for a very long time.',
          still: true,
          body: { kind: 'reptile', size: [11, 4], legs: 2, tail: { len: 8, style: 'down' }, crest: 2, neck: 2 },
          palette: { b: '#6a6a50', d: '#3e4030', l: '#92906e', e: '#0c0c06', y: '#d8d4b8' },
        },
        {
          key: 'kiwi', slot: 4, common: 'North Island brown kiwi', scientific: 'Apteryx mantelli', localName: 'kiwi', localLanguage: 'te reo Māori',
          traits: ['Round shaggy body with no visible wings or tail', 'Very long pale bill with nostrils at the tip'],
          iucn: 'VU', fact: 'The only bird with nostrils at the end of its bill. It finds worms by smell, snuffling as it goes.',
          source: iucn('Apteryx mantelli'),
          activity: 'nocturnal', zone: 'ground', stages: ['chick', 'juvenile', 'adult', 'elder'],
          behaviour: 'Works through the leaf litter after dark, probing deep with that long bill.',
          body: { kind: 'bird', size: [9, 7], beak: 7, legs: 3, tail: { len: 0, style: 'none' } },
          palette: { b: '#6a5a46', d: '#44382a', l: '#8e7c62', e: '#120e08', y: '#d8cdb4', w: '#2a2218' },
        },
      ],
      understory: [
        { key: 'moss', label: 'Moss', what: 'Moss on everything — this forest is never dry', colour: '#4e7244' },
        { key: 'koru', label: 'Unfurling fronds', what: 'New fern fronds; more of them as the grove recovers', colour: '#6a9a52' },
        { key: 'kauri-gum', label: 'Kauri gum', what: 'Hardened resin on the trunks', colour: '#c89a4a' },
        { key: 'glowworm', label: 'Glow-worms', what: 'Arachnocampa larvae in the damp banks, at night', colour: '#7ad8c0' },
      ],
    },
    {
      key: 'southern-alps',
      label: 'Southern Alps',
      note: 'Golden snow tussock and scree under a hard line of snow and rock.',
      ground: ['#9a8e5e', '#7d7248', '#b0a068'],
      ambience: ['snow', 'mist'],
      plants: [
        {
          key: 'mountain-beech', common: 'Mountain beech', scientific: 'Fuscospora cliffortioides', localName: 'tawhairauriki', localLanguage: 'te reo Māori',
          form: 'broadleaf', traits: ['Small dark leathery leaves in dense flat sprays', 'Wind-flattened crown, abruptly ending at the treeline'],
          iucn: 'NE', fact: 'Forms a treeline so sharp it looks drawn with a ruler — above a certain altitude it simply stops.',
          source: gbif('Fuscospora cliffortioides'),
          crown: ['#1c2a1e', '#283c28', '#365032', '#486a40', '#648856'], bark: ['#60584a', '#443e34', '#2a2620'], ailing: 'bare', spread: 0.9,
        },
        {
          key: 'snow-tussock', common: 'Narrow-leaved snow tussock', scientific: 'Chionochloa rigida',
          form: 'hummock', traits: ['Big golden arching tussock', 'Catches the light from behind'],
          iucn: 'NE', fact: 'Combs moisture out of the fog, which is part of why these catchments run so reliably.',
          source: gbif('Chionochloa rigida'),
          crown: ['#6a5c30', '#86723c', '#a28a48', '#bfa458', '#dcc272'], bark: ['#7a6a40', '#584c2e', '#3a321f'], ailing: 'dry', spread: 0.7,
        },
        {
          key: 'mount-cook-lily', common: 'Mount Cook lily', scientific: 'Ranunculus lyallii',
          form: 'shrub', traits: ['Big round glossy leaves that hold water like a dish', 'Large white flowers with gold centres'],
          iucn: 'NE', fact: 'The largest buttercup in the world, and not a lily at all.',
          source: gbif('Ranunculus lyallii'),
          crown: ['#2e4430', '#3c583a', '#4e7046', '#648a56', '#f0f0e4'], bark: ['#4a5440', '#36402e', '#242a1e'], ailing: 'dry', spread: 0.6,
        },
      ],
      creatures: [
        {
          key: 'kea', slot: 0, common: 'Kea', scientific: 'Nestor notabilis', localName: 'kea', localLanguage: 'te reo Māori',
          traits: ['Olive-green body with brilliant orange under the wings', 'Long curved grey-brown upper bill'],
          iucn: 'EN', fact: 'The only true alpine parrot, and relentlessly inquisitive — it will dismantle a car aerial for the fun of it.',
          source: iucn('Nestor notabilis'),
          activity: 'diurnal', zone: 'slope', stages: ['chick', 'fledgling', 'adult', 'elder'],
          behaviour: 'Hops about the rocks pulling at things, and flashes orange whenever it opens its wings.',
          body: { kind: 'bird', size: [10, 8], beak: 4, tail: { len: 5, style: 'down' }, legs: 2 },
          palette: { b: '#5a6a34', d: '#3a4620', l: '#7f8e4e', e: '#120e08', y: '#e07a28', w: '#4a4438' },
        },
        {
          key: 'pihoihoi', slot: 1, common: 'New Zealand pipit', scientific: 'Anthus novaeseelandiae', localName: 'pīhoihoi', localLanguage: 'te reo Māori',
          traits: ['Streaked brown, with a pale eyebrow', 'Constantly bobs its tail'],
          iucn: 'LC', fact: 'Runs rather than hops, and flicks its tail almost without stopping.',
          source: nzbirds('new-zealand-pipit'),
          activity: 'diurnal', zone: 'ground', stages: ['chick', 'fledgling', 'adult', 'elder'],
          behaviour: 'Runs a few steps across open ground, stops, bobs its tail, runs on.',
          body: { kind: 'bird', size: [6, 4], beak: 2, tail: { len: 4, style: 'down' }, legs: 2 },
          palette: { b: '#8a7656', d: '#5a4c34', l: '#bfae8c', e: '#120e08', y: '#d8cdb0', w: '#3a3024' },
        },
        {
          key: 'piwauwau', slot: 2, common: 'New Zealand rock wren', scientific: 'Xenicus gilviventris', localName: 'pīwauwau', localLanguage: 'te reo Māori',
          traits: ['Tiny and almost tailless', 'Olive-green above, yellow flanks, long toes'],
          iucn: 'EN', fact: "New Zealand's only true alpine bird — it stays above the treeline all winter, under the snow.",
          source: iucn('Xenicus gilviventris'),
          activity: 'diurnal', zone: 'slope', stages: ['chick', 'fledgling', 'adult', 'elder'],
          behaviour: 'Bobs on a rock, flicks between boulders, and is gone into a crevice.',
          body: { kind: 'bird', size: [4, 4], beak: 2, tail: { len: 1, style: 'up' }, legs: 2 },
          palette: { b: '#6a7a44', d: '#44502a', l: '#9aa868', e: '#100c06', y: '#d8c060', w: '#3a4020' },
        },
        {
          key: 'karearea', slot: 3, common: 'New Zealand falcon', scientific: 'Falco novaeseelandiae', localName: 'kārearea', localLanguage: 'te reo Māori',
          traits: ['Dark brown above, heavily streaked below', 'Pointed wings and a long barred tail'],
          iucn: 'LC', national: 'At Risk — Recovering under the New Zealand Threat Classification System',
          fact: 'Hunts in level flight at well over a hundred kilometres an hour, and will see off birds several times its size.',
          source: iucn('Falco novaeseelandiae'),
          activity: 'diurnal', zone: 'sky', stages: ['chick', 'fledgling', 'adult', 'elder'],
          behaviour: 'Cuts fast and low across the tussock, then swings up onto a rock to watch.',
          body: { kind: 'flyer', size: [11, 5], tail: { len: 5, style: 'down' }, beak: 2 },
          palette: { d: '#3a2e22', b: '#55432f', g: '#241c14', y: '#d8c060', r: '#8a7250' },
        },
        {
          key: 'takahe', slot: 4, common: 'Takahē', scientific: 'Porphyrio hochstetteri', localName: 'takahē', localLanguage: 'te reo Māori',
          traits: ['Heavy flightless body in deep blue and olive-green', 'Massive scarlet bill and matching legs'],
          iucn: 'EN', fact: 'Declared extinct, then found again in 1948 in a valley in the Murchison Mountains. There are still only a few hundred.',
          source: iucn('Porphyrio hochstetteri'),
          activity: 'diurnal', zone: 'ground', stages: ['chick', 'juvenile', 'adult', 'elder'],
          behaviour: 'Pulls a tussock stem out, holds it in one foot, and eats the soft base.',
          body: { kind: 'bird', size: [11, 9], beak: 3, legs: 3, tail: { len: 2, style: 'up' }, neck: 2 },
          palette: { b: '#20467a', d: '#142c52', l: '#3a6a9a', e: '#c0302a', y: '#e04a30', w: '#2a6a4a' },
        },
      ],
      understory: [
        { key: 'tussock', label: 'Snow tussock', what: 'Golden tussock, thicker where it is sheltered', colour: '#bfa458' },
        { key: 'scree', label: 'Scree', what: 'Loose shattered rock below the bluffs', colour: '#8e8c86' },
        { key: 'cushion', label: 'Cushion plants', what: 'Tight cushions hugging the ground out of the wind', colour: '#6a8450' },
        { key: 'snowpatch', label: 'Snow patch', what: 'Old snow lingering in the shade', colour: '#e8eef4' },
      ],
    },
  ],
};
