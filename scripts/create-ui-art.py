from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import uuid
root=Path(__file__).resolve().parent.parent
ui=root/'assets/ui'; fonts=root/'assets/fonts'
S=2
im=Image.new('RGB',(1152*S,672*S),'#191267'); d=ImageDraw.Draw(im)
def poly(points,c): d.polygon([(int(x*S),int(y*S)) for x,y in points],fill=c)
# Original diagonal poster geometry; no source-game screen is copied.
poly([(0,0),(780,0),(355,672),(0,672)],'#242795')
poly([(265,0),(990,0),(570,672),(0,672)],'#292cb4')
poly([(940,0),(1152,0),(1152,672),(520,672)],'#23136f')
poly([(0,465),(1152,170),(1152,305),(0,600)],'#3925a1')
poly([(0,492),(1152,197),(1152,215),(0,510)],'#4934bc')
for y in range(0,672,12):
 for x in range(0,1152,12):
  if (x//12+y//12)%2==0:
   d.rectangle((x*S,y*S,(x+3)*S,(y+3)*S),fill='#393bb9')
# Fine diagonal speed lines and a checker band near the foot.
for off in range(-672,1300,64): d.line((off*S,672*S,(off+420)*S,0),fill='#4544c2',width=S)
for y in range(624,672,8):
 for x in range(0,1152,8):
  if (x//8+y//8)%2==0:d.rectangle((x*S,y*S,(x+8)*S,(y+8)*S),fill='#17104c')
im.resize((1152,672),Image.Resampling.LANCZOS).save(ui/'alpha-backdrop.png')
# A fresh typographic treatment built from the OFL Anton display font.
word=Image.new('RGBA',(1050*S,300*S)); w=ImageDraw.Draw(word)
f=ImageFont.truetype(str(fonts/'Anton-Regular.ttf'),139*S)
text='STREET FIGHTER'; box=w.textbbox((0,0),text,font=f,stroke_width=0)
tw=box[2]-box[0]; x=(1050*S-tw)//2; y=35*S-box[1]
w.text((x+9*S,y+15*S),text,font=f,fill='#100b2f',stroke_width=11*S,stroke_fill='#100b2f')
w.text((x+5*S,y+8*S),text,font=f,fill='#f04b67',stroke_width=7*S,stroke_fill='#f04b67')
w.text((x,y),text,font=f,fill='#ffd34d',stroke_width=2*S,stroke_fill='#fff3b0')
word=word.transform(word.size,Image.Transform.AFFINE,(1,-.17,26*S,0,1,0),Image.Resampling.BICUBIC)
word=word.crop(word.getbbox()); word.thumbnail((960,260),Image.Resampling.LANCZOS)
wordmark=Image.new('RGBA',(960,280));wordmark.alpha_composite(word,((960-word.width)//2,(280-word.height)//2));wordmark.save(ui/'street-fighter-wordmark.png')
slash=Image.new('RGBA',(512,72));a=ImageDraw.Draw(slash)
a.polygon([(16,0),(512,0),(486,72),(0,72)],fill='#f04b67');a.polygon([(24,0),(42,0),(17,72),(0,72)],fill='#fff3b0');slash.save(ui/'alpha-slash.png')
for fighter in ['ryu','ken']:
 pose=Image.open(root/f'assets/fighters/{fighter}/idle-1.png').convert('RGBA')
 box=pose.getbbox();pose=pose.crop(box)
 # Honest source-art portrait: preserve pixels and original silhouette, crop legs.
 pose=pose.crop((0,0,pose.width,int(pose.height*.76)))
 if fighter == 'ken': pose=pose.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
 pose.thumbnail((360,420),Image.Resampling.NEAREST)
 scale=min(360//pose.width,420//pose.height)
 pose=pose.resize((pose.width*scale,pose.height*scale),Image.Resampling.NEAREST)
 portrait=Image.new('RGBA',(384,440));portrait.alpha_composite(pose,((384-pose.width)//2,440-pose.height));portrait.save(ui/f'{fighter}-portrait.png')
for p in [fonts/'Anton-Regular.ttf', fonts/'Anton-OFL.txt', fonts/'PixelifySans-Bold.ttf', fonts/'PixelifySans-OFL.txt',ui/'alpha-backdrop.png',ui/'street-fighter-wordmark.png',ui/'alpha-slash.png',ui/'ryu-portrait.png',ui/'ken-portrait.png']:
 guid=uuid.uuid5(uuid.NAMESPACE_URL,'poc-street-fighter/ui-redesign/'+p.name)
 settings='\n[settings]\natlas = "ui-menu"\ncompression = "none"\nmipmaps = false\n' if p.suffix=='.png' else ''
 if p.suffix=='.ttf': settings='\n[settings]\ncharset = "ascii"\nextra = "'+('→←↑↓·—…×' if p.name.startswith('Anton') else '·—…×')+'"\n'
 importer='texture' if p.suffix=='.png' else 'font' if p.suffix=='.ttf' else 'data'
 p.with_name(p.name+'.gmeta').write_text(f'guid = "{guid}"\nimporter = "{importer}"\n'+settings)
