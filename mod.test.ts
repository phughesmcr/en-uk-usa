/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { Dictionary } from "./mod.ts";
import { data } from "./data.ts";

//
// gb → us
//
Deno.test("gbToUs: mirrors lowercase, uppercase, titlecase", () => {
  const dict = new Dictionary();
  assertEquals(dict.gbToUs("colour", true), "color");
  assertEquals(dict.gbToUs("COLOUR", true), "COLOR");
  assertEquals(dict.gbToUs("Colour", true), "Color");
});

Deno.test("gbToUs: mixed-case transfers case only where characters match (shorter us target)", () => {
  const dict = new Dictionary();
  assertEquals(dict.gbToUs("coLour", true), "coLor");
  assertEquals(dict.gbToUs("coloUr", true), "color");
});

Deno.test("gbToUs: array overload and passthrough for unknown words", () => {
  const dict = new Dictionary();
  const input = ["colour", "centre", "unknownword"];
  const actual = dict.gbToUs(input, true);
  assertEquals(actual, ["color", "center", "unknownword"]);
});

Deno.test("gbToUs: matchCase=false returns canonical us form (lowercase)", () => {
  const dict = new Dictionary();
  assertEquals(dict.gbToUs("Colour", false), "color");
  assertEquals(dict.gbToUs("CENTRE", false), "center");
});

// Extra mixed-case samples across differing lengths
Deno.test("gbToUs: mixed-case aeroplane→airplane (target shorter), per-char mapping", () => {
  const dict = new Dictionary();
  // Only indices with matching letters mirror case
  assertEquals(dict.gbToUs("AeRopLaNe", true), "AiRplane");
});

Deno.test("gbToUs: mixed-case where letters change (greyish→grayish) mirrors only matches", () => {
  const dict = new Dictionary();
  // 'e'→'a' differs; casing not transferred; matching 'I'/'H' mirror case
  assertEquals(dict.gbToUs("GrEyIsH", true), "GrayIsH");
});

//
// us → gb
//
Deno.test("usToGb: mirrors lowercase, uppercase, titlecase", () => {
  const dict = new Dictionary();
  assertEquals(dict.usToGb("color", true), "colour");
  assertEquals(dict.usToGb("COLOR", true), "COLOUR");
  assertEquals(dict.usToGb("Color", true), "Colour");
});

Deno.test("usToGb: mixed-case transfers case only where characters match (longer gb target)", () => {
  const dict = new Dictionary();
  assertEquals(dict.usToGb("coLor", true), "coLour");
  assertEquals(dict.usToGb("ColoR", true), "Colour");
});

Deno.test("usToGb: array overload and passthrough for unknown words", () => {
  const dict = new Dictionary();
  const input = ["color", "center", "unknownword"];
  const actual = dict.usToGb(input, true);
  assertEquals(actual, ["colour", "centre", "unknownword"]);
});

Deno.test("usToGb: matchCase=false returns canonical gb form (lowercase)", () => {
  const dict = new Dictionary();
  assertEquals(dict.usToGb("Color", false), "colour");
  assertEquals(dict.usToGb("CENTER", false), "centre");
});

//
// runtime updates
//
Deno.test("runtime add: adds pair both directions and supports titlecase input", () => {
  const dict = new Dictionary();
  dict.add({ gb: "tyre", us: "tire" });
  assertEquals(dict.gbToUs("tyre", true), "tire");
  assertEquals(dict.usToGb("tire", true), "tyre");
  assertEquals(dict.gbToUs("Tyre", true), "Tire");
});

Deno.test("runtime add overrides existing pair", () => {
  const dict = new Dictionary([{ gb: "colour", us: "hue" }]);
  // overridden mapping wins
  assertEquals(dict.gbToUs("colour", false), "hue");
  assertEquals(dict.usToGb("hue", false), "colour");
});

Deno.test("runtime remove by GB word removes both sides (case-insensitive)", () => {
  const dict = new Dictionary();
  dict.add({ gb: "mouldy", us: "moldy" });
  assertEquals(dict.gbToUs("mouldy", true), "moldy");
  dict.remove("MOULDY");
  assertEquals(dict.gbToUs("mouldy", true), "mouldy");
  assertEquals(dict.usToGb("moldy", true), "moldy");
});

Deno.test("runtime remove by US word removes both sides (case-insensitive)", () => {
  const dict = new Dictionary();
  dict.add({ gb: "moustache", us: "mustache" });
  assertEquals(dict.usToGb("mustache", true), "moustache");
  dict.remove("Mustache");
  assertEquals(dict.gbToUs("moustache", true), "moustache");
  assertEquals(dict.usToGb("mustache", true), "mustache");
});

Deno.test("runtime remove on non-existent word is a no-op", () => {
  const dict = new Dictionary();
  dict.remove("nonexistent");
  assertEquals(dict.gbToUs("colour", false), "color");
});

// TitleCase add does not normalize keys (documented behavior)
Deno.test("runtime add: TitleCase keys do not match lowercase lookups", () => {
  const dict = new Dictionary();
  dict.add({ gb: "Gaol", us: "Jail" });
  // Lowercase lookup doesn't hit TitleCase key
  assertEquals(dict.gbToUs("gaol", true), "gaol");
  // TitleCase does
  assertEquals(dict.gbToUs("Gaol", true), "Jail");
  // Removing lowercase gb doesn't delete TitleCase entry
  dict.remove("gaol");
  assertEquals(dict.gbToUs("Gaol", true), "Jail");
  // Removing exact US TitleCase removes both sides
  dict.remove("Jail");
  assertEquals(dict.gbToUs("Gaol", true), "Gaol");
});

Deno.test("runtime remove with Turkish locale may not match ASCII keys (document behavior)", () => {
  const dict = new Dictionary();
  // Ensure mapping exists
  assertEquals(dict.gbToUs("fibre", false), "fiber");
  // 'FIBRE'.toLocaleLowerCase('tr') becomes 'fıbre' (dotless ı), not matching 'fibre'
  dict.remove("FIBRE", "tr");
  // Mapping remains intact
  assertEquals(dict.gbToUs("fibre", false), "fiber");
});

Deno.test("runtime override keeps previous reverse mapping (stale reverse documented)", () => {
  const dict = new Dictionary([{ gb: "colour", us: "hue" }]);
  // Override works for the new US word
  assertEquals(dict.usToGb("hue", false), "colour");
  // Original reverse mapping 'color'→'colour' from dataset remains
  assertEquals(dict.usToGb("color", false), "colour");
});

//
// dataset sanity checks
//
Deno.test("dataset: every gb maps to us (matchCase=false)", () => {
  const dict = new Dictionary();
  for (const [gb, us] of Object.entries(data)) {
    const actual = dict.gbToUs(gb, false);
    if (actual !== us) {
      throw new Error(`gbToUs mismatch for ${gb}: expected ${us}, got ${actual}`);
    }
  }
});

Deno.test("dataset: every us maps to gb (matchCase=false)", () => {
  const dict = new Dictionary();
  for (const [gb, us] of Object.entries(data)) {
    const actual = dict.usToGb(us, false);
    if (actual !== gb) {
      throw new Error(`usToGb mismatch for ${us}: expected ${gb}, got ${actual}`);
    }
  }
});
