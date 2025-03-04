import {
  CatchallKey,
  Expression,
  Literal,
  MessageExpressionPart,
  Message,
  SelectMessage,
  VariableRef,
  Variant,
  isSelectMessage,
  parseMessage
} from "npm:messageformat@4.0.0-8";
import * as plural from "npm:plurals-cldr";
export type { Message };
export { parseMessage };

function isPluralSelector(message: Message,
                          variable: VariableRef) : boolean {
   // Check if this variable's RHS has a `:number` annotation.
   const decls = message.declarations;
   for (var decl of decls) {
     if (decl.name == variable.name) {
         const rhs: Expression = decl.value;
         if (rhs.functionRef === undefined || rhs.functionRef === null) {
            // Also need to handle aliasing: we could have
             // .local $x = {$y} where $y has a selector annotation
             if (rhs.arg !== undefined && rhs.arg.type === 'variable') {
               return isPluralSelector(message, rhs.arg);
             } else {
             // RHS must be an unannotated literal
               return false;
             }
         }
         if (rhs.functionRef !== undefined && rhs.functionRef.type === 'function') {
           return rhs.functionRef.name === 'number';
         }
         // This means `variable`'s RHS has an annotation that isn't the plural
         // selector/formatter
         return false;
    }
  }
  // Variable is unbound, which means there's an "unresolved variable" error
  // in the message, but we ignore it
  return false;
}

function partialWildcards(keys: Array<Literal | CatchallKey>) : boolean {
  var wildcardSeen: boolean = false;
  var nonWildcardSeen: boolean = false;
  for (var k of keys) {
    if (k.type === 'literal') {
      nonWildcardSeen = true;
    } else if (k.type === '*') {
      wildcardSeen = true;
    }
  }
  return wildcardSeen && nonWildcardSeen;
}

function allWildcards(keys: Array<Literal | CatchallKey>) : boolean {
  for (var k of keys) {
    if (k.type === 'literal') {
      return false;
    }
  }
  return true;
}

function insertEverywhere(element: string, permutations: string[][]) : string[][] {
  if (permutations.length === 0) {
    return [[element]];
  }

  var result: string[][] = [];
  const permutationLen: number = permutations.length;
  permutations.forEach((perm: string[]) => {
    for (var i = 0; i < permutationLen + 1; i++) {
      result.push(perm.toSpliced(i, 0, element));
    }
  });
  return result;
}

function stringsEqual(p1: string[], p2: string[]) {
  if (p1.length != p2.length) {
    return false;
  }
  for (var i = 0; i < p1.length; i++) {
    if (p1[i] !== p2[i]) {
      return false;
    }
  }
  return true;
}

function contains(perms: string[][], perm: string[]) {
  for (var p of perms) {
    if (stringsEqual(p, perm)) {
      return true;
    }
  }
  return false;
}

function addNoDuplicates(result: string[][],
                         toAdd: string[][]) {
  for (var perm of toAdd) {
    if (!contains(result, perm)) {
      result.push(perm);
    }
  }
}

// It would be tempting to use a Set for this, but not feasible
// since the elements are arrays.
function generatePermutations(n: number, strings: string[]): string[][] {
  var result: string[][] = [];
  if (n === 0) {
    return result;
  }
  strings.map((s: string) => {
    addNoDuplicates(result,
                    insertEverywhere(s, generatePermutations(n - 1, strings)));
  });
  return result;
}

function keysEqual(ks: Array<Literal | CatchallKey>,
                   keyNames: string[]) : boolean {
  if (ks.length != keyNames.length) {
    return false;
  }
  for (var i = 0; i < ks.length; i++) {
    if (ks[i].type !== 'literal' || (ks[i] as Literal).value !== keyNames[i]) {
      return false;
    }
  }
  return true;
}

function variantExistsFor(variants: Variant[],
                          keys: string[]) : [boolean, string] {
  for (var variant of variants) {
    if (variant.keys.length != keys.length) {
      return [ false, "Warning: variant has fewer keys than there are selectors" ];
    }
    if (allWildcards(variant.keys)) {
      continue;
    }
    if (partialWildcards(variant.keys)) {
      return [false, ""];
    }
    if (keysEqual(variant.keys, keys)) {
      return [true, ""];
    }
  }
  return [false, `Omitted variant: ${JSON.stringify(keys)}. `];
}

function checkValidKeys(variants: Variant[],
                        categories: string[]) : [boolean, string] {
  for (var variant of variants) {
    for (var k of variant.keys) {
      if (k.type === '*') {
        continue;
      }
      if (!categories.includes(k.value)) {
        return [false, `Key ${k.value} is not a valid plural category for the given locale`];
      }
    }
  }
  return [true, ""];
}

function checkPlurals(categories: string[],
                      message: Message) : string {
  if (!isSelectMessage(message)) {
    return "Warning: message is not made up of a .match construct. Trivially correct.";
  }
  const variants: Variant[] = (message as SelectMessage).variants;
  const selectors: VariableRef[] = (message as SelectMessage).selectors;

  // Check that all selectors are plural; if any are non-plural, it's unclear
  // how many variants there should be
  for (var sel of selectors) {
    if (!isPluralSelector(message, sel)) {
      return "Message uses non-plural selectors. Can't check exhaustiveness.";
    }
  }

  // Check for partial wildcard variants (variants with multiple keys where
  // some are wildcards and some aren't)
  for (var variant of variants) {
    if (partialWildcards(variant.keys)) {
      return "Partial wildcard variant is present; not all permutations of categories are explicitly enumerated.";
    }
  }

  // Generate all n-permutations of plural categories, where n is the number of selectors
  const permutations: string[][] = generatePermutations(selectors.length, categories);

  var result: string = "";
  // Check that the number of variants == the number of permutations plus 1
  if (variants.length != permutations.length + 1) {
    result += `Error: incorrect number of variants: there are ${variants.length} and should be ${permutations.length + 1} including the wildcard variant. `;
  }

  // Check that each permutation has a corresponding variant
  var allOK: boolean = true;
  for (var permutation of permutations) {
    const [booleanResult, stringResult] = variantExistsFor(variants, permutation);
    allOK &&= booleanResult;
    result += stringResult;
  }

  // Check for keys that aren't valid plural category names
  const [booleanResult, stringResult] = checkValidKeys(variants, categories);
  allOK &&= booleanResult;
  result += stringResult;

  if (allOK) {
    return "Plural categories used correctly for the given locale";
  }
  return result;
}

export function validateMessage(
       locale: string,
       message: Message) : string {
  const forms: string[] = plural.forms(locale);
  if (forms == null) {
      return "error getting plural forms";
  }

  const pluralsResult: string = checkPlurals(forms, message);

  return pluralsResult;
}
