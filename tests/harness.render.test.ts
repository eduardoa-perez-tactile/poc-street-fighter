import { renderTest } from '@gameengine/test';

// Starter visual baseline. Replace with arena/combat scenarios when the port lands.
renderTest('starter scene renders within budget', async ({ step, input, render }) => {
  input.view(1080, 1920, 1);
  await step(180);
  render.expectDrawCalls('<=', 30, { width: 360, height: 640 });
  render.expectScreenshot('starter', { width: 360, height: 640 });
});
