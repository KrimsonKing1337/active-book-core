const levels = [
  0,
  25,
  50,
  100,
];

type VolumeCase = {
  global: number;
  category: number;
  relative: number;
};

export const volumeCases: VolumeCase[] = [];

for (const global of levels) {
  for (const category of levels) {
    for (const relative of levels) {
      volumeCases.push({
        global,
        category,
        relative,
      });
    }
  }
}
