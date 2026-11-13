import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const browserTests = [
  'videoPlayback.browser.test.js',
  'videoDialogs.browser.test.js',
  'videoLoading.browser.test.js',
  'carousel.browser.test.js',
  'carouselContent.browser.test.js',
  'carouselInteraction.browser.test.js',
  'readerDialogs.browser.test.js',
  'confirmDialogs.browser.test.js',
  'readerNotices.browser.test.js',
  'storyWindows.browser.test.js',
  'windowHistory.browser.test.js',
  'storyDialog.browser.test.js',
  'storyRoot.browser.test.js',
  'visualPlacement.browser.test.js',
  'visualLifecycle.browser.test.js',
  'unifiedVisualEffects.browser.test.js',
  'visualPlayground.browser.test.js',
  'persistentStory.browser.test.js',
  'localSurfaces.browser.test.js',
  'nativeAnimations.browser.test.js',
  'storyRegions.browser.test.js',
  'mediaContinuity.browser.test.js',
  'finalDemos.browser.test.js',
];

const testFiles = browserTests.map((filename) => {
  return fileURLToPath(new URL(filename, import.meta.url));
});

const result = spawnSync(process.execPath, [
  '--test',
  '--test-concurrency=1',
  ...testFiles,
], { stdio: 'inherit' });

if (result.error) {
  console.error(result.error);

  process.exitCode = 1;
} else if (result.signal) {
  console.error(`Browser tests terminated by signal ${result.signal}`);

  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
