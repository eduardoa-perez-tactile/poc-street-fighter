import { Sprite } from '@gameengine/runtime';
import { expect, renderTest } from '@gameengine/test';
import { ArenaVisualState, Fighter, MatchIntent, MatchState, MenuIntent, MenuState, StagePart } from '../src/schema.gen.ts';
import { STAGES } from '../src/data/stages.ts';
import { pieceImage, stagePieces, STAGE_SLOT_COUNT } from '../src/presentation/stage-parts.ts';

for (const stage of STAGES) {
  renderTest(`original stage ${stage.key} renders selected art`, async ({ loaded, input, step, world, render }) => {
    input.view(1152,672,1); await loaded(); await step(2);
    const menu = async (action: number, value: number) => {
      const state = world.resource(MenuState);
      input.emit(MenuIntent,{action,value,screen:state.screen,id:state.lastIntent+1}); await step(2);
    };
    await menu(7,2);
    for (let index=0;index<stage.id;index++) await menu(6,2);
    input.emit(MatchIntent,{action:8}); await step(2);
    input.emit(MatchIntent,{action:0}); await step(185);
    expect(world.resource(MatchState).stageId).toBe(stage.id);
    render.expectDrawCalls('<=',30,{width:1152,height:672});
    const visible=world.entities(StagePart).filter((entity)=>world.get(entity,Sprite).visible);
    expect(visible.length).toBe(stagePieces(stage.id).length);
    expect(world.entities(StagePart).length).toBe(STAGE_SLOT_COUNT);
    for (const entity of visible) expect(world.get(entity,StagePart).stageId).toBe(stage.id);
    if (stage.id>0) for (const entity of visible) expect(world.get(entity,Sprite).image?.startsWith(`stages/${stage.key}/`)).toBe(true);
    render.expectScreenshot('stage',{width:768,height:448});
    // Check both camera limits as well as the centered stage composition.
    for (const [name, positions] of [['left', [24, 96]], ['right', [672, 744]]] as const) {
      for (const entity of world.entities(Fighter)) {
        const player = world.get(entity, Fighter).player;
        world.insert(entity, Fighter, { x: positions[player]!, state: 0, frame: 0 });
      }
      await step(3);
      render.expectScreenshot(`stage-${name}`, { width:768, height:448 });
    }
  },{memory:'phone-low'});
}

renderTest('stage slots restore Ken after cycling all locations', async ({ loaded,input,step,world,render }) => {
  await loaded(); await step(2);
  const menu = async (action:number,value:number) => {
    const state=world.resource(MenuState);
    input.emit(MenuIntent,{action,value,screen:state.screen,id:state.lastIntent+1}); await step(2);
    render.stats();
  };
  await menu(7,2);
  for(let id=1;id<=5;id++) {
    await menu(6,2);
    const stageId=id%5, pieces=stagePieces(stageId);
    expect(world.resource(MatchState).stageId).toBe(stageId);
    const slots=world.entities(StagePart);
    expect(slots.length).toBe(STAGE_SLOT_COUNT);
    for(const entity of slots) {
      const part=world.get(entity,StagePart),sprite=world.get(entity,Sprite);
      expect(sprite.visible).toBe(part.index<pieces.length);
      if(sprite.visible) {
        const piece=pieces[part.index]!;
        expect(part.stageId).toBe(stageId);
        // A slot retains its entity across locations: verify its old shape and art
        // were replaced as well as its cached stage id, especially on return to Ken.
        expect(sprite.size[0]).toBeCloseTo(piece.width/100,5);
        expect(sprite.size[1]).toBeCloseTo(piece.height/100,5);
        expect(sprite.sortingLayer).toBe(piece.layer);
        expect(sprite.order).toBe(piece.order);
        expect(sprite.image).toBe(pieceImage(piece,world.resource(ArenaVisualState).tick));
      }
    }
  }
});
