import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createLoginLimiter } from "../src/middleware/login-limit.js";
import { errorHandler } from "../src/middleware/errors.js";

test("login limits cannot be bypassed with spoofed forwarding headers and expire", async () => {
  let time = 0;
  const app = express();
  app.post("/login", createLoginLimiter({ limit: 2, windowMs: 1000, now: () => time }), (_req, res) => res.sendStatus(401));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${(server.address() as {port:number}).port}/login`;
  try {
    for (let i = 0; i < 2; i++) assert.equal((await fetch(url, { method: "POST" })).status, 401);
    const blocked = await fetch(url, { method: "POST", headers: { "X-Forwarded-For": "203.0.113.99" } });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get("retry-after"), "1");
    time = 1001;
    assert.equal((await fetch(url, { method: "POST" })).status, 401);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("production hides internal failures and malformed JSON while preserving validation errors", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const app = express();
  app.use(express.json());
  app.post("/error", (req, _res, next) => next(Object.assign(new Error("database password secret"), { status: req.body.status })));
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${(server.address() as {port:number}).port}/error`;
  const send = (body: string) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  try {
    for (const status of [500, 503, 200]) {
      const response = await send(JSON.stringify({ status }));
      assert.equal(response.status, status === 200 ? 500 : status);
      assert.deepEqual(await response.json(), { error: "Internal server error" });
    }
    const malformed = await send('{"private":"secret",');
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: "Invalid JSON body" });
    const validation = await send('{"status":409}');
    assert.equal(validation.status, 409);
    assert.deepEqual(await validation.json(), { error: "database password secret" });
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous;
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
