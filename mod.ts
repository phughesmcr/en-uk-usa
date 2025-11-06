/**
 * British ↔ American spelling translator.
 *
 * This module exposes a `Dictionary` that can translate individual words
 * between British English (en-GB) and American English (en-US).
 *
 * Notes:
 * - Translation is word-based. If a word is not found it is returned as-is.
 * - By default, the translation attempts to mirror the input word's letter casing
 *   (e.g., "Colour" → "Color", "COLOUR" → "COLOR"). This can be disabled.
 *
 * @copyright   2025 the library authors. All rights reserved.
 * @license     MIT
 * @module
 */
import { data } from "./data.ts";

/**
 * Applies the casing pattern from `pattern` to `text`.
 *
 * Heuristics:
 * - If `pattern` is ALL UPPERCASE → uppercase entire `text`.
 * - If `pattern` is all lowercase → lowercase entire `text`.
 * - If `pattern` is Titlecase (first upper, rest lower) → titlecase `text`.
 * - Otherwise (mixed casing), transfer case per character only when the
 *   characters are the same ignoring case; leave non-matching characters as-is.
 *
 * @param input - The source text whose letters will be re-cased.
 * @param toMatch - The casing pattern to mirror.
 * @returns The `input` transformed to match the casing of `toMatch`.
 */
function _matchCase(input: string, toMatch: string): string {
  if (input.length === 0 || toMatch.length === 0) return input;

  const isTitleCase: boolean = toMatch.charAt(0) === toMatch.charAt(0).toUpperCase() &&
    toMatch.slice(1) === toMatch.slice(1).toLowerCase();
  if (isTitleCase) {
    const head: string = input.charAt(0).toUpperCase();
    const tail: string = input.slice(1).toLowerCase();
    return head + tail;
  }

  const isAllUpper: boolean = toMatch === toMatch.toUpperCase();
  if (isAllUpper) return input.toUpperCase();

  const isAllLower: boolean = toMatch === toMatch.toLowerCase();
  if (isAllLower) return input.toLowerCase();

  // Mixed casing: change only indices where characters match (case-insensitive)
  const out: string[] = [];
  const last = Math.min(input.length, toMatch.length);
  for (let i = 0; i < last; i++) {
    const src = input.charAt(i);
    const ref = toMatch.charAt(i);
    if (src.toLowerCase() === ref.toLowerCase()) {
      const isRefUpper = ref >= "A" && ref <= "Z";
      out.push(isRefUpper ? src.toUpperCase() : src.toLowerCase());
    } else {
      out.push(src);
    }
  }
  if (input.length > toMatch.length) {
    out.push(input.slice(toMatch.length));
  }
  return out.join("");
}

/**
 * A bilingual dictionary that translates words between British English (en-GB)
 * and American English (en-US).
 *
 * The dictionary is initialized with a static data set and supports runtime
 * augmentation via {@link Dictionary.add} and removal via {@link Dictionary.remove}.
 *
 * Case behavior:
 * - Methods default to mirroring the input word's letter casing. To disable
 *   this, pass `matchCase = false`.
 *
 * Usage example:
 *
 * ```ts
 * const dict = new Dictionary();
 * dict.gbToUs("colour");             // => "color"
 * dict.gbToUs("Colour");             // => "Color"
 * dict.gbToUs(["colour", "centre"]); // => ["color", "center"]
 * dict.usToGb("color");              // => "colour"
 * dict.usToGb("COLOR");              // => "COLOUR"
 * dict.gbToUs("Colour", false);      // => "color" (no case matching)
 *
 * // Runtime updates
 * dict.add({ gb: "tyre", us: "tire" });
 * dict.gbToUs("tyre");             // => "tire"
 * dict.remove("tyre");
 * dict.gbToUs("tyre");             // => "tyre" (no longer translated)
 * ```
 */
export class Dictionary {
  #enGB: Record<string, [enUS: string, regex: RegExp]>;
  #enUS: Record<string, [enGB: string, regex: RegExp]>;

  constructor(additions: { gb: string; us: string }[] = []) {
    this.#enGB = {};
    this.#enUS = {};
    Object.entries(data).forEach(([key, value]) => {
      this.add({ gb: key, us: value });
    });
    additions.forEach(({ gb, us }) => {
      this.add({ gb, us });
    });
  }

  /**
   * Adds or replaces a translation pair at runtime.
   *
   * @param params - The translation pair to add.
   * @param params.gb - The British English word.
   * @param params.us - The American English word.
   * @returns The dictionary instance.
   */
  add({ gb, us }: { gb: string; us: string }): Dictionary {
    this.#enGB[gb] = [us, new RegExp(gb, "gmi")];
    this.#enUS[us] = [gb, new RegExp(us, "gmi")];
    return this;
  }

  /**
   * Removes a translation pair if present.
   *
   * Removes the entry for `word` in the en-GB map as well as its reverse entry
   * in the en-US map if they exist. If absent, this is a no-op.
   *
   * @param word - The British or American word to remove.
   * @returns The dictionary instance.
   */
  remove(word: string, locales?: Intl.LocalesArgument | string | string[]): Dictionary {
    const cleanedWord = word.toLocaleLowerCase(locales);
    if (cleanedWord.length === 0) return this;

    let gbKey: string | undefined;
    let usKey: string | undefined;

    // Prefer exact keys first
    const enGbExact = this.#enGB[word];
    if (enGbExact) {
      gbKey = word;
      usKey = enGbExact[0];
    } else {
      const enUsExact = this.#enUS[word];
      if (enUsExact) {
        usKey = word;
        gbKey = enUsExact[0];
      } else {
        // Fallback to case-insensitive via locale-lowercased keys
        const enGbLower = this.#enGB[cleanedWord];
        if (enGbLower) {
          gbKey = cleanedWord;
          usKey = enGbLower[0];
        } else {
          const enUsLower = this.#enUS[cleanedWord];
          if (enUsLower) {
            usKey = cleanedWord;
            gbKey = enUsLower[0];
          }
        }
      }
    }

    if (gbKey) delete this.#enGB[gbKey];
    if (usKey) delete this.#enUS[usKey];
    return this;
  }

  /**
   * Iterates over the translation pairs in the dictionary.
   *
   * @returns An iterator over the translation pairs in the dictionary.
   * @example
   * ```ts
   * for (const [gb, us] of dictionary.entries()) {
   *   console.log(`${gb} -> ${us}`);
   * }
   * ```
   */
  *entries(): IterableIterator<[gb: string, us: string]> {
    for (const [gb, [us]] of Object.entries(this.#enGB)) {
      yield [gb, us];
    }
  }

  #translateGBToUS(word: string, matchCase: boolean): string {
    const entry = this.#enGB[word] ?? this.#enGB[word.toLowerCase()];
    if (!entry) return word;
    const [us] = entry;
    return matchCase ? _matchCase(us, word) : us;
  }

  /**
   * Translates word(s) from British English (en-GB) to American English (en-US).
   *
   * If a word is not present in the dictionary, it is returned unchanged.
   *
   * @param words - A single word or a list of words to translate.
   * @param matchCase - Whether to mirror the input word's casing pattern. Defaults to `true`.
   * @returns The translated word or list of words.
   */
  gbToUs(word: string, matchCase: boolean): string;
  gbToUs(words: string[], matchCase: boolean): string[];
  gbToUs(words: string | string[], matchCase: boolean = true): string | string[] {
    if (Array.isArray(words)) {
      return words.map((word) => this.#translateGBToUS(word, matchCase));
    }
    return this.#translateGBToUS(words, matchCase);
  }

  #translateUSToGB(word: string, matchCase: boolean): string {
    const entry = this.#enUS[word] ?? this.#enUS[word.toLowerCase()];
    if (!entry) return word;
    const [gb] = entry;
    return matchCase ? _matchCase(gb, word) : gb;
  }

  /**
   * Translates word(s) from American English (en-US) to British English (en-GB).
   *
   * If a word is not present in the dictionary, it is returned unchanged.
   *
   * @param words - A single word or a list of words to translate.
   * @param matchCase - Whether to mirror the input word's casing pattern. Defaults to `true`.
   * @returns The translated word or list of words.
   */
  usToGb(word: string, matchCase: boolean): string;
  usToGb(words: string[], matchCase: boolean): string[];
  usToGb(words: string | string[], matchCase: boolean = true): string | string[] {
    if (Array.isArray(words)) {
      return words.map((word) => this.#translateUSToGB(word, matchCase));
    }
    return this.#translateUSToGB(words, matchCase);
  }
}

export default Dictionary;
