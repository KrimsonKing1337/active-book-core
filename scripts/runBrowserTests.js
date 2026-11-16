import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const browserTests = [
  'audioLifecycle/audioLifecycle.browser.test.js',
  'audioLifecycle/audioDisposal.browser.test.js',
  'audioLifecycle/audioVolume.browser.test.js',
  'audioLifecycle/fadeIn.browser.test.js',
  'audioLifecycle/fadeOut.browser.test.js',
  'audioLifecycle/fadeLifecycle.browser.test.js',
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
  const testsDirectory = new URL('../tests/', import.meta.url);
  const testFiles = browserTests.map((filenameCur) => {
    return fileURLToPath(new URL(filenameCur, testsDirectory));
  });

  const args = [
    '--test',
    '--test-concurrency=1',
    ...testFiles,
  ];

  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });

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
