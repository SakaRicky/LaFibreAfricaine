import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const target=await fetch("http://127.0.0.1:9229/json/new?about:blank",{method:"PUT"}).then(r=>r.json()) as {webSocketDebuggerUrl:string};
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise<void>(resolve=>ws.addEventListener("open",()=>resolve(),{once:true}));
let counter=0;const pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void}>();const errors:string[]=[];
ws.addEventListener("message",event=>{const msg=JSON.parse(String(event.data));if(msg.method==="Network.responseReceived" && msg.params.response.url.includes("/api/admin/")) console.log("HTTP",msg.params.response.status,new URL(msg.params.response.url).pathname);if(msg.id){const p=pending.get(msg.id);pending.delete(msg.id);if(msg.error)p?.reject(new Error(msg.error.message));else p?.resolve(msg.result);}else if(msg.method==="Runtime.exceptionThrown")errors.push(JSON.stringify(msg.params.exceptionDetails));});
function call(method:string,params:Record<string,unknown>={}):Promise<any>{const id=++counter;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression:string){return (await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true})).result.value;}
async function waitFor(expression:string){for(let i=0;i<80;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw new Error(`Page did not become ready: ${expression}`);}

try {
 const readme=await readFile(new URL("../../README.md",import.meta.url),"utf8");
 const credentials=readme.match(/Seeded account: `([^`]+)` \/ `([^`]+)`/);
 if(!credentials)throw new Error("Seeded test credentials not found");
 await call("Page.enable");await call("Runtime.enable");await call("Network.enable");await call("Network.clearBrowserCookies");
 await call("Page.addScriptToEvaluateOnNewDocument",{source:`
  const originalFetch = window.fetch.bind(window);
  let sessionChecks = 0;
  window.fetch = (...args) => {
    const response = originalFetch(...args);
    if (String(args[0]).endsWith('/api/admin/me') && ++sessionChecks === 2) {
      return response.then(value => new Promise(resolve => setTimeout(() => resolve(value), 2000)));
    }
    return response;
  };
 `});
 await call("Page.navigate",{url:"http://localhost:5173/admin/login"});
 await waitFor('!!document.querySelector("input[type=password]")');
 await evaluate('document.querySelector("input[type=email]").focus()');
 await call("Input.insertText",{text:credentials[1]});
 await evaluate('document.querySelector("input[type=password]").focus()');
 await call("Input.insertText",{text:credentials[2]});
 await evaluate('document.querySelector("button[type=submit]").click()');
 await new Promise(r=>setTimeout(r,2500));
 assert.equal(await evaluate('location.pathname'),'/admin/dashboard',"A stale session check must not reset a successful login");
 console.log("PASS login survives a delayed initial session check");
 await call("Page.reload");
 await waitFor('document.querySelector("h1")?.textContent === "Tableau de bord"');
 console.log("PASS session persists after refresh");
 await call("Page.navigate",{url:"http://localhost:5173/admin/login"});
 await waitFor('location.pathname === "/admin/dashboard" && document.querySelector("h1")?.textContent === "Tableau de bord"');
 console.log("PASS authenticated login URL redirects to dashboard");
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Déconnexion"))?.click()');
 await waitFor('location.pathname === "/admin/login" && !!document.querySelector("input[type=password]")');
 console.log("PASS logout returns to login");
 await evaluate('document.querySelector("input[type=email]").focus()');
 await call("Input.insertText",{text:credentials[1]});
 await evaluate('document.querySelector("input[type=password]").focus()');
 await call("Input.insertText",{text:"intentionally-wrong-qa-password"});
 await evaluate('document.querySelector("button[type=submit]").click()');
 await waitFor('!!document.querySelector("[role=alert]")');
 assert.equal(await evaluate('document.querySelector("input[type=email]").value'),credentials[1]);
 assert.equal(await evaluate('document.querySelector("input[type=password]").value'),"intentionally-wrong-qa-password");
 console.log("PASS incorrect password displays an error without clearing the fields");
 assert.equal(errors.length,0,"No browser runtime errors");
}finally{ws.close();}
