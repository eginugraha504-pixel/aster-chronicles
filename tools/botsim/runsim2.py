import asyncio,json,sys,time,os
HERE=os.path.dirname(os.path.abspath(__file__));GAME=os.path.join(HERE,'..','..','dist','index.html')
from playwright.async_api import async_playwright
# runsim2.py PROFIL SKILL HARI SEED out.json
PF={'santai':([12,21],[6,18]),'reguler':([8,13,18,22],[8,22]),'rajin':([7,10,12,16,19,22],[10,30]),'hardcore':([6,8,10,12,14,16,18,20,22],[15,45])}
pf,sk,DAYS,seed,out=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4]),sys.argv[5]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':400,'height':820})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+os.path.abspath(GAME)+'#skipboot');await pg.wait_for_timeout(1500)
        await pg.add_script_tag(path=os.path.join(HERE,'sim2.js'))
        hrs,ln=PF[pf]
        await pg.evaluate("o=>{closeModal();SIM.reset(o)}",{'skill':sk,'hrs':hrs,'len':ln,'seed':seed})
        rows=[];t0=time.time()
        for d in range(DAYS):
            r=await pg.evaluate("SIM.runDay()");rows.append(r)
            json.dump({'rows':rows,'ms':None},open(out,'w'))
        ms=await pg.evaluate("JSON.stringify({ms:SIM.ms,counts:SIM.counts,battles:SIM.battles,wins:SIM.wins,sweeps:SIM.sweeps})")
        json.dump({'rows':rows,'ms':json.loads(ms),'errs':errs[:5],'sec':round(time.time()-t0)},open(out,'w'))
        await b.close()
asyncio.run(main())
