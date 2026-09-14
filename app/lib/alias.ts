import { hash32 } from "./hash";

const ADJECTIVES = [
  "salmon", "apricot", "cobalt", "amber", "cyan", "indigo", "olive", "crimson",
  "teal", "violet", "saffron", "mint", "copper", "azure", "coral", "plum",
  "ivory", "jade", "russet", "lilac", "ochre", "sienna", "cerulean", "magenta",
  "chartreuse", "maroon", "peach", "slate", "topaz", "umber", "verdant", "bronze",
];

const ANIMALS = [
  "stingray", "bobcat", "pangolin", "narwhal", "ibex", "kestrel", "marmot",
  "okapi", "axolotl", "lemur", "caracal", "tapir", "puffin", "gecko", "manatee",
  "quokka", "wombat", "heron", "otter", "badger", "falcon", "dingo", "meerkat",
  "capybara", "osprey", "serval", "gibbon", "walrus", "mantis", "koala",
  "raccoon", "toucan",
];

// Two-word handle in the spirit of "salmon stingray" — anonymous but memorable,
// and stable for the life of the browser session.
export function aliasFor(id: string): string {
  const h = hash32(id);
  return `${ADJECTIVES[h % ADJECTIVES.length]} ${
    ANIMALS[(h >>> 8) % ANIMALS.length]
  }`;
}
