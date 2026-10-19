import type { RenderContext, TestInput, TestWorld, UIContext } from '@gameengine/test';
import { MenuIntent, MenuState } from '../src/schema.gen.ts';
export interface UIFlowContext { world: TestWorld; input: TestInput; step(n?: number): Promise<void>; render: RenderContext; ui: UIContext }
export async function press(c: UIFlowContext, id: string, width = 1152, height = 672) {
  c.render.stats({ width, height }); await c.ui.press(id); await c.step(2);
}
export async function beginLocal(c: UIFlowContext, width = 1152, height = 672) {
  await press(c, 'press-start', width, height); await press(c, 'local', width, height); await press(c, 'fight', width, height); await c.step(92);
}
export async function menuCommand(c: UIFlowContext, action: number, value = 0) {
  const menu = c.world.resource(MenuState);
  c.input.emit(MenuIntent, { action, value, screen: menu.screen, id: menu.lastIntent + 1 }); await c.step(2);
}
