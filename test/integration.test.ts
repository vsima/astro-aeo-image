import { test } from "node:test";
import assert from "node:assert/strict";
import aeoImage from "../src/integration.ts";

// A minimal stand-in for Astro's astro:config:setup hook arguments.
function runSetup(integration: ReturnType<typeof aeoImage>, currentImage: any = {}) {
  const updates: any[] = [];
  const logs: { level: string; msg: string }[] = [];
  const hook = integration.hooks["astro:config:setup"];
  assert.ok(hook, "astro:config:setup hook must exist");
  (hook as Function)({
    config: { image: currentImage },
    updateConfig: (u: any) => updates.push(u),
    logger: {
      info: (m: string) => logs.push({ level: "info", msg: m }),
      warn: (m: string) => logs.push({ level: "warn", msg: m }),
    },
  });
  return { updates, logs };
}

test("integration has the correct name", () => {
  assert.equal(aeoImage().name, "astro-aeo-image");
});

test("setup hook points the image service at our service entrypoint", () => {
  const { updates } = runSetup(aeoImage());
  assert.equal(updates.length, 1);
  assert.equal(updates[0].image.service.entrypoint, "astro-aeo-image/service");
});

test("setup hook forwards options as the service config", () => {
  const { updates } = runSetup(aeoImage({ useAltAsDescription: false }));
  assert.deepEqual(updates[0].image.service.config, { useAltAsDescription: false });
});

test("warns when a non-default custom service is already configured", () => {
  const { logs } = runSetup(aeoImage(), { service: { entrypoint: "some/other-service" } });
  assert.ok(logs.some((l) => l.level === "warn" && /custom image service/i.test(l.msg)));
});

test("does not warn for the default sharp service", () => {
  const { logs } = runSetup(aeoImage(), {
    service: { entrypoint: "astro/assets/services/sharp" },
  });
  assert.ok(!logs.some((l) => l.level === "warn"));
});
