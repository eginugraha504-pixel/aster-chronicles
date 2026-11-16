import json
from prompts import ACT
STYLE='e76edb88-0a55-4e18-bdf6-41f5a1136fc6'
B=("Match EXACTLY the art style, pixel density, chibi proportions, outline and shading of the FIRST reference image (an animation sprite sheet); use the other reference image(s) only for this character's design and colors. "
"Pixel art animation sprite sheet of ONE chibi anime girl for a side-view 2D mobile RPG battle, exactly 8 frames in a perfectly regular grid of 4 columns and 2 rows, each frame centered in its own equal cell with generous padding, "
"the character ALWAYS faces RIGHT (three-quarter view toward the right), identical size in every cell with feet on the same baseline, full body, cute chibi proportions (head about 40 percent of height), big sparkling anime eyes, expressive face, "
"crisp clean dark outline, soft cel shading, vibrant palette, the exact same outfit, colors, hair and weapon in all 8 frames. Frames in reading order: 1 idle standing relaxed holding the weapon, 2 idle breathing (slightly lower, hair settling), "
"3 walking right foot forward, 4 walking left foot forward, 5 {a1}, 6 {a2}, 7 hurt: recoiling backward with eyes squeezed shut, 8 casting her skill: {sk}. Character: {d} "
"No background scenery, no ground, no shadow, no text, no frame borders, no grid lines. Background: absolutely flat uniform pure magenta #FF00FF.")
H={
'sakuya':('katana',['0eec14a4-10fc-4c4c-8905-d13328e1f599','388e0bc0-ff1f-44d7-b515-9add564ac03b'],'Sakuya, the Sakura Fox Shrine Maiden: long straight black hair with a pink sakura hair ornament, white fox ears with pink inner fur, a big fluffy white fox tail, crimson eyes, miko outfit with white haori with wide sleeves and red hakama, holding a katana with a pink cherry-blossom guard.','katana held up glowing with pink fox-fire and petals'),
'raika':('bow',['8ad3902a-dfb2-4d67-bfe6-1d62422e080a','d1ce9005-74d8-46ba-8e03-dd4ec2ab4326'],'Raika, the Wandering Thunder Archer: long black hair in a low ponytail, red eyes, a wide straw conical kasa hat with a paper talisman tassel, dark navy wanderer coat with cyan lightning accents and black gloves, holding a black and electric-cyan thunder bow.','aiming the bow straight up with crackling cyan lightning'),
'mira':('bow',['f173cdae-ab02-470d-beff-b001bf2978da'],'Mira, the Forest Archer: long brown hair, bright green eyes, green feathered hunter cap with a red feather, green ranger tunic with a brown belt and a quiver, brown boots, wooden longbow.','aiming the bow up with a glowing green root-magic arrow'),
'noa':('staff',['7abba2d0-633a-49be-abb5-27bb31e13483'],'Noa, the Dew Witch apprentice: long light-blue hair, sleepy cute blue eyes, an oversized pale-blue witch hat that is too big for her with a star charm, white and light-blue robe dress with a small cape, wooden staff topped with a blue crystal.','raising the staff with sparkling healing water droplets around her'),
'pia':('shield',['4d61f3ac-f40e-47f1-bed2-5d8b7fa32963'],'Pia, the Tiny Knight: short pink bob hair, pink eyes, a white helmet-cap with a red stripe, small silver armor over a red tunic, a huge round shield bigger than her body with a red cross emblem, and a short sword.','planting the shield with a glowing golden barrier dome'),
'rin':('axe',['92d6841b-7dd6-40d2-92a9-7b51c17351ef'],'Rin, the Axe Girl: messy spiky orange hair in a high ponytail, energetic orange eyes, big grin, red-orange sleeveless tunic, brown shorts and boots, bandaged forearms, a big woodcutter axe.','spinning with the axe surrounded by fiery embers'),
'vela':('staff',['fbe0d170-9791-4208-a56e-d6e096f9bb48'],'Vela, the Crescent Moon Witch: long lavender hair, calm half-lidded purple eyes, tall dark purple witch hat with a crescent moon pin, deep purple robe with silver crescent moon embroidery, staff topped with a silver crescent moon.','holding the staff up with a glowing purple moon glyph'),
'bruna':('shield',['21774af6-f097-4026-b032-04a5f0f721d0'],'Bruna, the Stone Guardian: silver-grey hair in a thick braid, steel helmet, sturdy grey and brown armor with leather straps, miner gloves, a large gold-rimmed tower shield with an earth emblem, and a short mace.','slamming the shield down with glowing rock fragments rising'),
'nami':('bow',['00dd8efb-6dbe-42e2-af43-6008670cfaa4'],'Nami, the Wave Archer from a port town: navy-blue hair in a ponytail, red bandana, blue eyes, white sailor-style top with a blue collar and a blue skirt, an ocean-blue bow.','aiming up with swirling water arrows'),
'kuro':('sword',['794ede23-0371-48bf-a60c-4a44305e56f6'],'Kuro, the Shadow Ninja apprentice girl: short black hair, dark red eyes, a long flowing red scarf, dark navy ninja outfit with wraps, a short ninja sword.','dashing with a purple shadow afterimage, sword held low'),
'lumi':('staff',['aec47045-1bee-44d7-a8e7-973af8a8d73e'],'Lumi, the Light Acolyte: short fluffy blonde hair, warm golden eyes, white acolyte robe with gold trim and a small white hood cape, a staff topped with a glowing golden lantern.','raising the lantern staff shining warm golden light'),
}
reqs=[];idx=10
order=list(H)
for hid in order:
    act,refs,d,sk=H[hid];a=ACT[act]
    p=B.format(a1=a[0],a2=a[1],sk=sk,d=d)
    for v in range(2):
        reqs.append({'index':idx,'params':{'model':'nano_banana_pro','aspect_ratio':'2:1','resolution':'2k','use_unlim':False,'medias':[{'role':'image_references','value':STYLE}]+[{'role':'image_references','value':r} for r in refs],'prompt':p}});idx+=1
json.dump(reqs[:12],open('batch1.json','w'));json.dump(reqs[12:],open('batch2.json','w'))
print(len(reqs),[ (r['index'],order[(r['index']-10)//2]) for r in reqs])
