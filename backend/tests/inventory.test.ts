import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { prisma } from "../src/prisma.js";
import app from "../src/app.js";
import { signAdminToken } from "../src/middleware/auth.js";
import { createSale, changeSale } from "../src/services/sales.js";
import { moveStock } from "../src/services/stock.js";
if (!process.env.INVENTORY_TEST_SCHEMA?.startsWith("inventory_test_") || !process.env.DATABASE_URL?.includes(process.env.INVENTORY_TEST_SCHEMA)) throw new Error("Isolated test schema required");
let actor:{id:number;name:string}; let collectionId:number; let server:Server; let base:string; let cookie:string;
before(async()=>{
 const admin=await prisma.adminUser.create({data:{email:"test@example.invalid",name:"Test admin",passwordHash:"unused"}});
 actor={id:admin.id,name:admin.name};cookie=`lfa_admin=${signAdminToken(admin.id)}`;
 const c=await prisma.collection.create({data:{slug:"test",nameEn:"Test",nameFr:"Test"}});collectionId=c.id;
 server=app.listen(0,"127.0.0.1");await new Promise<void>(resolve=>server.once("listening",()=>resolve()));
 base=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
});
after(async()=>{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));await prisma.$disconnect();});
async function product(stock=5,variant=false){return prisma.product.create({data:{slug:randomUUID(),name:"Test bag",collectionId,priceCents:1000,stock,sizes:variant?{create:{size:"M · Rouge",color:"Rouge",stock}}:undefined}});}
function input(productId:number,extra:Record<string,unknown>={}){return {requestKey:randomUUID(),items:[{productId,quantity:1}],paymentMethod:"cash",paymentReceived:true,fulfillment:"awaiting_pickup",...extra};}
async function stock(id:number){return (await prisma.product.findUniqueOrThrow({where:{id}})).stock;}
async function api(path:string,body?:unknown,auth=true,method?:string){return fetch(base+"/api/admin"+path,{method:method??(body?"POST":"GET"),headers:{"Content-Type":"application/json",...(auth?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});}

test("cash sale records admin/date and deducts stock, duplicate submissions do not deduct twice",async()=>{
 const p=await product();const data=input(p.id);const [a,b]=await Promise.all([createSale(data,actor),createSale(data,actor)]);
 assert.equal(a.id,b.id);assert.equal(await stock(p.id),4);assert.equal(a.salespersonId,actor.id);assert.equal(a.paymentStatus,"paid");assert.equal(a.customerName,"");assert.ok(a.createdAt);
});
test("Interac reserves immediately; explicit confirmation is required and never deducts again",async()=>{
 const p=await product(2);const sale=await createSale(input(p.id,{paymentMethod:"interac",paymentReceived:false}),actor);
 assert.equal(sale.paymentStatus,"awaiting");assert.equal(await stock(p.id),1);
 await assert.rejects(changeSale(sale.id,{action:"confirm_payment",version:0},actor));
 await assert.rejects(changeSale(sale.id,{action:"fulfillment",fulfillment:"completed",version:0},actor));
 const paid=await changeSale(sale.id,{action:"confirm_payment",version:0,paymentReceived:true},actor);
 assert.equal(paid.paymentStatus,"paid");assert.equal(paid.paymentConfirmedBy,actor.id);assert.equal(await stock(p.id),1);
 await assert.rejects(changeSale(sale.id,{action:"confirm_payment",version:0,paymentReceived:true},actor));
});
test("simultaneous reservations cannot sell the last variant twice",async()=>{
 const p=await product(1,true);const attempt=()=>createSale(input(p.id,{items:[{productId:p.id,size:"M · Rouge",quantity:1}],paymentMethod:"interac",paymentReceived:false}),actor);
 const results=await Promise.allSettled([attempt(),attempt()]);assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(await stock(p.id),0);
 assert.equal((await prisma.productSize.findFirstOrThrow({where:{productId:p.id}})).stock,0);
});
test("variant selection is mandatory and invalid quantities or oversized discounts are rejected atomically",async()=>{
 const p=await product(5,true);await assert.rejects(createSale(input(p.id),actor));
 await assert.rejects(createSale(input(p.id,{items:[{productId:p.id,size:"M · Rouge",quantity:-1}]}),actor));
 await assert.rejects(createSale(input(p.id,{items:[{productId:p.id,size:"M · Rouge",quantity:1}],discountCents:1001}),actor));
 assert.equal(await stock(p.id),5);
});
test("cancelling releases a reservation exactly once, even with simultaneous requests",async()=>{
 const p=await product(1);const s=await createSale(input(p.id,{paymentMethod:"interac",paymentReceived:false}),actor);
 const request={version:s.version,action:"cancel",reason:"Client cancelled"};const results=await Promise.allSettled([changeSale(s.id,request,actor),changeSale(s.id,request,actor)]);
 assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(await stock(p.id),1);
 assert.equal((await prisma.order.findUniqueOrThrow({where:{id:s.id}})).lifecycle,"cancelled");
});
test("partial returns prorate discounts, optionally restock, reject over-returns and preserve actor audit",async()=>{
 const p=await product(5,true);let s=await createSale(input(p.id,{items:[{productId:p.id,size:"M · Rouge",quantity:3}],discountCents:100,fulfillment:"completed"}),actor);
 const line=s.items[0];s=await changeSale(s.id,{version:s.version,action:"return",reason:"Damaged",refundConfirmed:true,items:[{itemId:line.id,quantity:1,restock:false}]},actor);
 assert.equal(await stock(p.id),2);assert.equal(s.refundedCents,967);
 await assert.rejects(changeSale(s.id,{version:s.version,action:"return",reason:"Too many",refundConfirmed:true,items:[{itemId:line.id,quantity:3,restock:true}]},actor));
 s=await changeSale(s.id,{version:s.version,action:"return",reason:"Remaining items",refundConfirmed:true,items:[{itemId:line.id,quantity:2,restock:true}]},actor);
 assert.equal(await stock(p.id),4);assert.equal(s.refundedCents,2900);assert.equal(s.lifecycle,"returned");assert.equal(s.paymentStatus,"refunded");assert.ok(s.events.some(e=>e.actor===actor.name&&e.action==="return"));
});
test("corrections release/reallocate atomically and preserve the previous sale",async()=>{
 const p=await product(2);let s=await createSale(input(p.id,{paymentMethod:"interac",paymentReceived:false}),actor);
 await assert.rejects(changeSale(s.id,{...input(p.id,{items:[{productId:p.id,quantity:3}],paymentMethod:"interac",paymentReceived:false}),action:"correct",version:0,reason:"Correction"},actor));
 assert.equal(await stock(p.id),1);
 s=await changeSale(s.id,{...input(p.id,{items:[{productId:p.id,quantity:2}],paymentMethod:"interac",paymentReceived:false}),action:"correct",version:0,reason:"Correction"},actor);
 assert.equal(await stock(p.id),0);assert.equal(s.totalCents,2000);assert.equal(s.paymentStatus,"awaiting");assert.ok(s.events.some(e=>e.action==="correction_before"));
});
test("stock receipt and adjustment maintain aggregate and variant stock and cannot consume reserved stock",async()=>{
 const p=await product(2,true);await prisma.$transaction(tx=>moveStock(tx,p.id,"M · Rouge",3,"Delivery",actor));assert.equal(await stock(p.id),5);
 await createSale(input(p.id,{items:[{productId:p.id,size:"M · Rouge",quantity:4}],paymentMethod:"interac",paymentReceived:false}),actor);
 await assert.rejects(prisma.$transaction(tx=>moveStock(tx,p.id,"M · Rouge",-2,"Adjustment",actor)));assert.equal(await stock(p.id),1);
 const v=await prisma.productSize.findFirstOrThrow({where:{productId:p.id}});assert.equal(v.stock,1);
});
test("every commerce endpoint requires authentication; legacy writes cannot bypass stock/payment rules",async()=>{
 for(const path of ["/sales","/dashboard","/inventory","/sales?export=csv"]){assert.equal((await api(path,undefined,false)).status,401);}
 assert.equal((await api("/sales",{},false)).status,401);assert.equal((await api("/inventory/adjust",{},false)).status,401);
 assert.equal((await api("/orders/1/status",{status:"paid"},true,"PATCH")).status,409);
 const p=await product();assert.equal((await api(`/products/${p.id}`,{stock:100},true,"PATCH")).status,400);
 assert.equal((await api(`/products/${p.id}/sizes`,{sizes:[]},true,"PATCH")).status,409);
});
test("storefront and admin share inventory; size omission cannot bypass a reservation",async()=>{
 const p=await product(1,true);const payload={customer:{name:"Test",email:"test@example.invalid",phone:"5555555555"},deliveryMethod:"pickup",items:[{slug:p.slug,size:"M · Rouge",quantity:1}]};
 const response=await fetch(base+"/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});assert.equal(response.status,201);
 assert.equal(await stock(p.id),0);await assert.rejects(createSale(input(p.id,{items:[{productId:p.id,size:"M · Rouge",quantity:1}]}),actor));
 const json=await response.json() as {orderNumber:string};const sale=await prisma.order.findUniqueOrThrow({where:{orderNumber:json.orderNumber}});assert.equal(sale.paymentStatus,"awaiting");
 await changeSale(sale.id,{action:"cancel",version:0,reason:"Cancelled"},actor);assert.equal(await stock(p.id),1);
});
test("history filtering, protected CSV export and dashboard return correct records",async()=>{
 const p=await product();const sale=await createSale(input(p.id,{customerName:"=SUM(1,2)"}),actor);
 const response=await api(`/sales?productId=${p.id}&salespersonId=${actor.id}&paymentMethod=cash`);assert.equal(response.status,200);const rows=await response.json() as {id:number}[];assert.deepEqual(rows.map(r=>r.id),[sale.id]);
 const csv=await api(`/sales?productId=${p.id}&export=csv`);assert.equal(csv.status,200);assert.match(await csv.text(),/'=SUM/);
 assert.equal((await api("/dashboard")).status,200);assert.equal((await api("/inventory")).status,200);
});

test("paid cancellations and corrections require explicit manual settlement",async()=>{
 const p=await product(3);const s=await createSale(input(p.id),actor);
 await assert.rejects(changeSale(s.id,{version:0,action:"cancel",reason:"Mistake"},actor));
 await assert.rejects(changeSale(s.id,{...input(p.id),version:0,action:"correct",reason:"Mistake"},actor));
 assert.equal(await stock(p.id),2);
 const cancelled=await changeSale(s.id,{version:0,action:"cancel",reason:"Mistake",refundConfirmed:true},actor);
 assert.equal(cancelled.refundedCents,1000);assert.equal(cancelled.paymentStatus,"refunded");assert.equal(await stock(p.id),3);
});
test("inventory variant creation is authenticated and preserves a single stock total",async()=>{
 const p=await product(0);
 assert.equal((await api("/inventory/variants",{productId:p.id,size:"M",color:"Bleu"},false)).status,401);
 assert.equal((await api("/inventory/variants",{productId:p.id,size:"M",color:"Bleu"})).status,201);
 assert.equal((await api("/inventory/adjust",{productId:p.id,size:"M · Bleu",delta:4,reason:"Delivery"})).status,200);
 assert.equal(await stock(p.id),4);assert.equal((await prisma.productSize.findFirstOrThrow({where:{productId:p.id}})).stock,4);
});
test("stale or deleted admin accounts cannot access protected endpoints",async()=>{
 const gone=await prisma.adminUser.create({data:{email:"gone@example.invalid",passwordHash:"unused"}});
 const token=signAdminToken(gone.id);await prisma.adminUser.delete({where:{id:gone.id}});
 const res=await fetch(base+"/api/admin/dashboard",{headers:{Cookie:`lfa_admin=${token}`}});assert.equal(res.status,401);
});

test("a completed cash sale can be corrected with a reason and manual settlement",async()=>{
 const p=await product(3);const sale=await createSale(input(p.id,{fulfillment:"completed"}),actor);
 const changed=await changeSale(sale.id,{...input(p.id,{items:[{productId:p.id,quantity:2}]}),version:0,action:"correct",reason:"Entered one instead of two",settlementConfirmed:true},actor);
 assert.equal(changed.fulfillment,"completed");assert.equal(changed.totalCents,2000);assert.equal(await stock(p.id),1);
});
