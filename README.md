# en-uk-usa

Translate strings between British (en_GB) and American (en_US) English.

This is a simple lookup-based library for speed. It aims to cover most common cases, with some exceptions. You can always add your own

```bash
# Node
npx jsr add @phughesmcr/en-uk-usa

# Deno
deno add jsr:@phughesmcr/en-uk-usa

# Bun
bunx jsr add @phughesmcr/en-uk-usa
```

```javascript
import { Dictionary } from "@phughesmcr/en-uk-usa";

// Create a Dictionary
const dictionary = new Dictionary();

// translate en_GB to en_US (splitting a string by word)
const gbString = "I'm visualising the colour of this yoghurt";
const gbResult = gbString.split(/\w+/).map((word) => dictionary.gbToUs(word)).join(" ");
// gbResult = "I'm visualising the colour of this yoghurt"

// translate en_US to en_GB
const usString = "This eon is among the most checkered. Oxidation has taken the plow.";
const usResult = dictionary.usToGb(usString.split(/\w+/)).join(" "); // you can split and map like above if you prefer
// usResult = "This aeon is amongst the most chequered . Oxidization has taken the plough ."

// add and remove your own word pairs
dictionary.add({ gb: "colour", us: "color" });
dictionary.remove("odourless"); // You can provide either the GB or US word here, both will be removed.

// disable case matching (results are always lowercase)
dictionary.gbToUs("Omelette", false); // omelet
// by default, gbToUs and usToGb will try and character-level case match 
// for example: gbToUs("CoLoUr") -> "CoLor"

```

## Warning

The aim of this library is to catch some of the most common spelling differences. This isn't a spell-checker and contains some opinionated choices. It doesn't contain all possible translations, for example:

- Doesn't include historic British English such as "gaol" -> "jail".
- Doesn't include cultural name changes, such as "draughts" -> "checkers".
- Doesn't include problematic swaps, such as "programme" -> "program", where program might refer to a computer program for example.

You can add and remove using the methods on dictionary.

## License

(C) 2025 [P. Hughes](https://www.phugh.es). All rights reserved.

Shared under the [MIT](LICENSE) license.
