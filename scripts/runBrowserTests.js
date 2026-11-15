import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const browserTests = [
  'selectionOutline/selectionOutline.browser.test.js',
  'dialogCarousel/dialogCarousel.browser.test.js',
  'dialogCarousel/dialogCarouselLayout.browser.test.js',
  'dialogCarousel/dialogCarouselFocus.browser.test.js',
  'videoPlayback/videoPlayback.browser.test.js',
  'videoPlayback/videoDialogs.browser.test.js',
  'videoPlayback/videoLoading.browser.test.js',
  'carousel/carousel.browser.test.js',
  'carousel/carouselContent.browser.test.js',
  'carousel/carouselInteraction.browser.test.js',
  'readerDialogs/readerDialogs.browser.test.js',
  'readerDialogs/confirmDialogs.browser.test.js',
  'readerDialogs/readerNotices.browser.test.js',
  'storyWindows/storyWindows.browser.test.js',
  'storyWindows/windowHistory.browser.test.js',
  'storyDialog/storyDialog.browser.test.js',
  'storyRoot/storyRoot.browser.test.js',
  'visualPlacement/visualPlacement.browser.test.js',
  'visualLifecycle/visualLifecycle.browser.test.js',
  'unifiedVisualEffects/unifiedVisualEffects.browser.test.js',
  'visualPlayground/visualPlayground.browser.test.js',
  'visualPlayground/persistentStory.browser.test.js',
  'visualPlacement/localSurfaces.browser.test.js',
  'visualPlayground/nativeAnimations.browser.test.js',
  'visualPlacement/storyRegions.browser.test.js',
  'mediaContinuity/mediaContinuity.browser.test.js',
  'visualPlayground/finalDemos.browser.test.js',
];

export const runBrowserTests = () => {
  const testFiles = browserTests.map((filename) => {
    return fileURLToPath(new URL(`../tests/${filename}`, import.meta.url));
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
};

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  runBrowserTests();
}
