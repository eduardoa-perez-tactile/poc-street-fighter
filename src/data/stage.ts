// Generated from KenStage.js. Source rectangles are top-left pixel coordinates.
export const STAGE_FRAMES = {
  "stage-background": {
    "sprite": "stage/stage-background",
    "rect": [
      72,
      208,
      768,
      176
    ]
  },
  "stage-boat": {
    "sprite": "stage/stage-boat",
    "rect": [
      8,
      16,
      521,
      180
    ]
  },
  "stage-floor-bottom": {
    "sprite": "stage/stage-floor-bottom",
    "rect": [
      8,
      448,
      896,
      16
    ]
  },
  "grey-suit-1": {
    "sprite": "stage/grey-suit-1",
    "rect": [
      600,
      24,
      16,
      24
    ]
  },
  "grey-suit-2": {
    "sprite": "stage/grey-suit-2",
    "rect": [
      600,
      88,
      16,
      24
    ]
  },
  "bollard-small": {
    "sprite": "stage/bollard-small",
    "rect": [
      800,
      184,
      21,
      16
    ]
  },
  "bollard-large": {
    "sprite": "stage/bollard-large",
    "rect": [
      760,
      176,
      31,
      24
    ]
  },
  "barrels": {
    "sprite": "stage/barrels",
    "rect": [
      560,
      472,
      151,
      96
    ]
  },
  "stage-floor": {
    "sprite": "stage/stage-floor",
    "rect": [
      8,
      392,
      896,
      56
    ]
  },
  "flag-1": {
    "sprite": "stage/flag-1",
    "rect": [
      848,
      312,
      40,
      32
    ]
  },
  "flag-2": {
    "sprite": "stage/flag-2",
    "rect": [
      848,
      264,
      40,
      32
    ]
  },
  "flag-3": {
    "sprite": "stage/flag-3",
    "rect": [
      848,
      216,
      40,
      32
    ]
  },
  "bald-man-1": {
    "sprite": "stage/bald-man-1",
    "rect": [
      552,
      8,
      40,
      64
    ]
  },
  "bald-man-2": {
    "sprite": "stage/bald-man-2",
    "rect": [
      552,
      72,
      40,
      64
    ]
  },
  "bald-man-3": {
    "sprite": "stage/bald-man-3",
    "rect": [
      552,
      136,
      40,
      64
    ]
  },
  "woman-1": {
    "sprite": "stage/woman-1",
    "rect": [
      624,
      16,
      32,
      56
    ]
  },
  "woman-2": {
    "sprite": "stage/woman-2",
    "rect": [
      624,
      80,
      32,
      56
    ]
  },
  "woman-3": {
    "sprite": "stage/woman-3",
    "rect": [
      624,
      144,
      32,
      56
    ]
  },
  "green-jumper-1": {
    "sprite": "stage/green-jumper-1",
    "rect": [
      664,
      16,
      32,
      56
    ]
  },
  "green-jumper-2": {
    "sprite": "stage/green-jumper-2",
    "rect": [
      664,
      80,
      32,
      56
    ]
  },
  "blue-coat-1": {
    "sprite": "stage/blue-coat-1",
    "rect": [
      704,
      16,
      48,
      56
    ]
  },
  "blue-coat-2": {
    "sprite": "stage/blue-coat-2",
    "rect": [
      704,
      80,
      48,
      56
    ]
  },
  "blue-coat-3": {
    "sprite": "stage/blue-coat-3",
    "rect": [
      704,
      144,
      48,
      56
    ]
  },
  "purple-jumper-1": {
    "sprite": "stage/purple-jumper-1",
    "rect": [
      808,
      24,
      48,
      32
    ]
  },
  "purple-jumper-2": {
    "sprite": "stage/purple-jumper-2",
    "rect": [
      808,
      72,
      48,
      32
    ]
  },
  "purple-jumper-3": {
    "sprite": "stage/purple-jumper-3",
    "rect": [
      808,
      120,
      48,
      32
    ]
  },
  "brown-suit-1": {
    "sprite": "stage/brown-suit-1",
    "rect": [
      760,
      16,
      40,
      40
    ]
  },
  "brown-suit-2": {
    "sprite": "stage/brown-suit-2",
    "rect": [
      760,
      64,
      40,
      40
    ]
  },
  "brown-suit-3": {
    "sprite": "stage/brown-suit-3",
    "rect": [
      760,
      112,
      40,
      40
    ]
  }
} as const;
// Durations are source milliseconds (fighter durations use simulation frames).
export const STAGE_ANIMATIONS = {
  "flag": [
    [
      "flag-1",
      133
    ],
    [
      "flag-2",
      133
    ],
    [
      "flag-3",
      133
    ]
  ],
  "baldMan": [
    [
      "bald-man-1",
      100
    ],
    [
      "bald-man-2",
      133
    ],
    [
      "bald-man-3",
      664
    ],
    [
      "bald-man-2",
      133
    ]
  ],
  "cheeringWoman": [
    [
      "woman-1",
      216
    ],
    [
      "woman-2",
      216
    ],
    [
      "woman-3",
      216
    ],
    [
      "woman-2",
      216
    ]
  ],
  "greenJumperGuy": [
    [
      "green-jumper-1",
      664
    ],
    [
      "green-jumper-2",
      498
    ],
    [
      "green-jumper-1",
      133
    ],
    [
      "green-jumper-2",
      133
    ]
  ],
  "blueCoatGuy": [
    [
      "blue-coat-1",
      996
    ],
    [
      "blue-coat-2",
      133
    ],
    [
      "blue-coat-3",
      100
    ],
    [
      "blue-coat-2",
      133
    ],
    [
      "blue-coat-1",
      249
    ],
    [
      "blue-coat-2",
      133
    ],
    [
      "blue-coat-3",
      100
    ],
    [
      "blue-coat-2",
      133
    ]
  ],
  "purpleJumperGuy": [
    [
      "purple-jumper-1",
      1992
    ],
    [
      "purple-jumper-2",
      166
    ],
    [
      "purple-jumper-3",
      166
    ],
    [
      "purple-jumper-2",
      166
    ],
    [
      "purple-jumper-1",
      664
    ],
    [
      "purple-jumper-2",
      166
    ],
    [
      "purple-jumper-3",
      166
    ],
    [
      "purple-jumper-2",
      166
    ],
    [
      "purple-jumper-3",
      166
    ],
    [
      "purple-jumper-2",
      166
    ]
  ],
  "brownSuitGuy": [
    [
      "brown-suit-1",
      133
    ],
    [
      "brown-suit-2",
      133
    ],
    [
      "brown-suit-3",
      133
    ],
    [
      "brown-suit-2",
      133
    ]
  ]
} as const;
// Placement offsets in original pixels; xScreen = x - cameraX / cameraDivisor.
export const STAGE_PLACEMENTS = [
  {
    "frame": "stage-background",
    "x": 16,
    "y": 0,
    "cameraDivisor": 2.157303,
    "layer": "background"
  },
  {
    "animation": "flag",
    "x": 560,
    "y": 16,
    "parent": "stage-background",
    "layer": "background"
  },
  {
    "frame": "stage-boat",
    "x": 150,
    "y": 0,
    "cameraDivisor": 1.613445,
    "layer": "boat"
  },
  {
    "animation": "baldMan",
    "x": 128,
    "y": 96,
    "parent": "stage-boat",
    "layer": "boat"
  },
  {
    "frames": [
      "grey-suit-1",
      "grey-suit-2"
    ],
    "x": 167,
    "y": 112,
    "parent": "stage-boat",
    "layer": "boat"
  },
  {
    "animation": "cheeringWoman",
    "x": 192,
    "y": 104,
    "parent": "stage-boat",
    "layer": "boat"
  },
  {
    "animation": "greenJumperGuy",
    "x": 224,
    "y": 104,
    "parent": "stage-boat",
    "layer": "boat"
  },
  {
    "animation": "blueCoatGuy",
    "x": 288,
    "y": 96,
    "parent": "stage-boat",
    "layer": "boat"
  },
  {
    "animation": "purpleJumperGuy",
    "x": 128,
    "y": 24,
    "parent": "stage-boat",
    "layer": "boat"
  },
  {
    "animation": "brownSuitGuy",
    "x": 88,
    "y": 24,
    "parent": "stage-boat",
    "layer": "boat"
  },
  {
    "frame": "stage-floor",
    "x": 32,
    "y": 176,
    "cameraDivisor": 1.55,
    "layer": "floor",
    "shearBase": -5.15,
    "shearCameraOffset": 1024,
    "shearCameraDivisor": 112
  },
  {
    "frame": "stage-floor-bottom",
    "x": 256,
    "y": 232,
    "cameraMultiplier": 1.1,
    "layer": "floor"
  },
  {
    "frame": "bollard-small",
    "x": 376,
    "y": 166,
    "cameraDivisor": 1.54,
    "layer": "background-props"
  },
  {
    "frame": "bollard-small",
    "x": 560,
    "y": 166,
    "cameraDivisor": 1.54,
    "layer": "background-props"
  },
  {
    "frame": "barrels",
    "x": 872,
    "y": 120,
    "cameraDivisor": 1,
    "layer": "background-props"
  },
  {
    "frame": "bollard-large",
    "x": 493,
    "y": 200,
    "cameraDivisor": 0.958,
    "layer": "foreground"
  },
  {
    "frame": "bollard-large",
    "x": 787,
    "y": 200,
    "cameraDivisor": 0.958,
    "layer": "foreground"
  }
] as const;
export const STAGE_FLOOR_STRIPS = [
  "stage/floor-strip-00",
  "stage/floor-strip-01",
  "stage/floor-strip-02",
  "stage/floor-strip-03",
  "stage/floor-strip-04",
  "stage/floor-strip-05",
  "stage/floor-strip-06",
  "stage/floor-strip-07",
  "stage/floor-strip-08",
  "stage/floor-strip-09",
  "stage/floor-strip-10",
  "stage/floor-strip-11",
  "stage/floor-strip-12",
  "stage/floor-strip-13",
  "stage/floor-strip-14",
  "stage/floor-strip-15",
  "stage/floor-strip-16",
  "stage/floor-strip-17",
  "stage/floor-strip-18",
  "stage/floor-strip-19",
  "stage/floor-strip-20",
  "stage/floor-strip-21",
  "stage/floor-strip-22",
  "stage/floor-strip-23",
  "stage/floor-strip-24",
  "stage/floor-strip-25",
  "stage/floor-strip-26",
  "stage/floor-strip-27",
  "stage/floor-strip-28",
  "stage/floor-strip-29",
  "stage/floor-strip-30",
  "stage/floor-strip-31",
  "stage/floor-strip-32",
  "stage/floor-strip-33",
  "stage/floor-strip-34",
  "stage/floor-strip-35",
  "stage/floor-strip-36",
  "stage/floor-strip-37",
  "stage/floor-strip-38",
  "stage/floor-strip-39",
  "stage/floor-strip-40",
  "stage/floor-strip-41",
  "stage/floor-strip-42",
  "stage/floor-strip-43",
  "stage/floor-strip-44",
  "stage/floor-strip-45",
  "stage/floor-strip-46",
  "stage/floor-strip-47",
  "stage/floor-strip-48",
  "stage/floor-strip-49",
  "stage/floor-strip-50",
  "stage/floor-strip-51",
  "stage/floor-strip-52",
  "stage/floor-strip-53",
  "stage/floor-strip-54",
  "stage/floor-strip-55"
] as const;
