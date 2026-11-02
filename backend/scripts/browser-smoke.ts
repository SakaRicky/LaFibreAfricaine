import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { prisma } from "../src/prisma.js";
import { signAdminToken } from "../src/middleware/auth.js";
if(process.env.NODE_ENV==="production") throw new Error("Local QA only");
const target=await fetch("http://127.0.0.1:9229/json/new?about:blank",{method:"PUT"}).then(r=>r.json()) as {webSocketDebuggerUrl:string};
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise<void>(resolve=>ws.addEventListener("open",()=>resolve(),{once:true}));
let counter=0;const pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void}>();const errors:string[]=[];
ws.addEventListener("message",event=>{const msg=JSON.parse(String(event.data));if(msg.id){const p=pending.get(msg.id);pending.delete(msg.id);if(msg.error)p?.reject(new Error(msg.error.message));else p?.resolve(msg.result);}else if(msg.method==="Runtime.exceptionThrown")errors.push(JSON.stringify(msg.params.exceptionDetails));});
function call(method:string,params:Record<string,unknown>={}):Promise<any>{const id=++counter;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression:string){return (await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true})).result.value;}
async function waitFor(expression:string){for(let i=0;i<80;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw new Error(`Page did not become ready: ${expression}`);}
try {
 await call("Page.enable");await call("Runtime.enable");await call("Network.enable");await call("Network.clearBrowserCookies");
 await call("Page.navigate",{url:"http://localhost:5173/admin/dashboard"});
 await waitFor('location.pathname === "/admin/login" && !!document.querySelector("input[type=password]")');
 console.log("PASS protected admin redirects to login");
 const admin=await prisma.adminUser.findFirst();if(!admin)throw new Error("No admin available for local read-only UI QA");
 await call("Network.setCookie",{name:"lfa_admin",value:signAdminToken(admin.id),url:"http://localhost:5173",httpOnly:true,sameSite:"Lax"});
 for(const width of [1440,390]){
  await call("Emulation.setDeviceMetricsOverride",{width,height:1000,deviceScaleFactor:1,mobile:width<500});
  for(const [route,title] of [["dashboard","Tableau de bord"],["sales/new","Enregistrer une vente"],["inventory","Inventaire partagé"],["reservations","Réservations"],["sales","Historique des ventes"],["products","Produits"]]){
   await call("Page.navigate",{url:`http://localhost:5173/admin/${route}`});
   await waitFor(`document.querySelector('h1')?.textContent.includes(${JSON.stringify(title)}) && !document.body.innerText.includes('Chargement…')`);
   const layout=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,alerts:[...document.querySelectorAll("[role=alert]")].map(x=>x.textContent)})');
   if(layout.scroll>layout.width)throw new Error(`Horizontal overflow ${route} ${width}: ${JSON.stringify(layout)}`);
   if(layout.alerts.length)throw new Error(`Error on ${route}: ${layout.alerts.join(", ")}`);
   console.log(`PASS ${route} ${width}px`);
   if(route==="inventory" && width===390) {
    await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Gérer"))?.click()');
    await waitFor('document.getElementById("inventory-editor").getBoundingClientRect().top < 150');
    console.log("PASS mobile inventory action scrolls to stock editor");
   }
   if(["dashboard","sales/new","inventory"].includes(route)){
    const screenshot=await call("Page.captureScreenshot",{format:"png"});await writeFile(`/tmp/lfa-${route.replaceAll("/","-")}-${width}.png`,Buffer.from(screenshot.data,"base64"));
   }
  }
 }
 if(errors.length)throw new Error(`Browser errors: ${errors.join("\n")}`);
 console.log("PASS no browser runtime exceptions");
}finally{await prisma.$disconnect();await call("Browser.close").catch(()=>{});ws.close();}
