import locales from "npm:locale-codes@1.3.1";
import { formatMessageToHTML, MessageFormat } from "./_utils/message_format.ts";
import { parseMessage, validatePlurals, validatePlaceholders, Message } from "./_utils/validate_message.ts";

const supportedLocales = locales.all
  .map((locale) => {
    if (locale.location == null) return null;
    try {
      return {
        locale: new Intl.Locale(locale.tag),
        name: locale.name,
        region: locale.location,
      };
    } catch {
      return null;
    }
  })
  .filter((locale) => locale !== null) as {
    locale: Intl.Locale;
    name: string;
    region: string;
  }[];

const exampleButtons =
  ["example_good",
   "example_czech",
   "example_czech_bad",
   "example_czech_no_selectors",
   "example_czech_no_plural_selectors",
   "example_czech_not_plural_category",
   "example_czech_multiple_selectors",
   "example_czech_multiple_selectors_bad",
   "example_czech_partial_wildcards",
   "example_parse_error",
   "example_czech_aliasing",
   "example_placeholders"];

function createOption(document, locale, name, region) {
  const option = document.createElement("option");
  option.value = locale.baseName;
  option.textContent = `${name} (${region})`;
  if (locale.baseName === "en-US") {
    option.selected = true;
  }
  return option;
}

document.addEventListener("DOMContentLoaded", () => {
  const sourceLocaleSelect = document.getElementById("sourceLocale") as HTMLSelectElement;
  const targetLocaleSelect = document.getElementById("targetLocale") as HTMLSelectElement;
  const sourceMessageArea = document.getElementById("sourceMessage") as HTMLTextAreaElement;
  const targetMessageArea = document.getElementById("targetMessage") as HTMLTextAreaElement;
  const sourceMessageErrors = document.getElementById(
    "source-message-errors",
  ) as HTMLDivElement;
  const targetMessageErrors = document.getElementById(
    "target-message-errors",
  ) as HTMLDivElement;
  const sourcePluralValidationArea = document.getElementById("pluralValidationSource") as HTMLDivElement;
  const targetPluralValidationArea = document.getElementById("pluralValidationTarget") as HTMLDivElement;
  const placeholderArea = document.getElementById("placeholderCheck") as HTMLDivElement;
  const sourceOutputErrors = document.getElementById(
    "source-output-errors",
  ) as HTMLDivElement;
  const targetOutputErrors = document.getElementById(
    "target-output-errors",
  ) as HTMLDivElement;

  sourceLocaleSelect.addEventListener("change", onUpdate);
  targetLocaleSelect.addEventListener("change", onUpdate);
  exampleButtons.forEach((buttonId) => {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    button.addEventListener('click', exampleButton(buttonId))
  });
  sourceMessageArea.addEventListener("input", onUpdate);
  targetMessageArea.addEventListener("input", onUpdate);

  sourceLocaleSelect.innerHTML = "";
  targetLocaleSelect.innerHTML = "";

  for (const { locale, name, region } of supportedLocales) {
    sourceLocaleSelect.appendChild(createOption(document, locale, name, region));
    targetLocaleSelect.appendChild(createOption(document, locale, name, region));
  }

  const hash = globalThis.location.hash.slice(1);
  try {
    if (hash) {
      const [encodedSourceMessage, encodedTargetMessage, encodedSourceLocale, encodedTargetLocale] = hash.split(".");
      const sourceMessage = atob(encodedSourceMessage);
      const sourceLocale = atob(encodedSourceLocale);
      const targetMessage = atob(encodedTargetMessage);
      const targetLocale = atob(encodedTargetLocale);
      sourceMessageArea.value = sourceMessage;
      targetMessageArea.value = targetMessage;
      sourceLocaleSelect.value = sourceLocale;
      targetLocaleSelect.value = targetLocale;
      onUpdate();
    }
  } catch (_) {
    // Ignore errors
  }

  function onUpdate() {
    const sourceMessage = sourceMessageArea.value;
    const targetMessage = targetMessageArea.value;

    sourceMessageErrors.textContent = "";
    sourceMessageErrors.hidden = true;
    sourcePluralValidationArea.textContent = "";
    sourceOutputErrors.textContent = "";
    sourceOutputErrors.hidden = true;
    targetMessageErrors.textContent = "";
    targetMessageErrors.hidden = true;
    targetPluralValidationArea.textContent = "";
    targetOutputErrors.textContent = "";
    targetOutputErrors.hidden = true;

    let sourceMf2: Message | null = null;
    try {
      sourceMf2 = parseMessage(sourceMessage);
    } catch (e) {
      sourcePluralValidationArea.textContent = (e as Error).message;
    }
    let targetMf2: Message | null = null;
    try {
      targetMf2 = parseMessage(targetMessage);
    } catch (e) {
      targetPluralValidationArea.textContent = (e as Error).message;
    }

    if (sourceMf2 !== null) {
       const validatorOutput = validatePlurals(sourceLocale.value, sourceMf2);
       sourcePluralValidationArea.textContent = validatorOutput;
    }
    if (targetMf2 !== null) {
       const validatorOutput = validatePlurals(targetLocale.value, targetMf2);
       targetPluralValidationArea.textContent = validatorOutput;
    }
    if (sourceMf2 !== null && targetMf2 !== null) {
       const placeholderOutput = validatePlaceholders(sourceLocale.value,
                                                      targetLocale.value,
                                                      sourceMf2,
                                                      targetMf2);
       placeholderArea.textContent = placeholderOutput;
    }

    const encodedSourceMessage = btoa(sourceMessageArea.value);
    const encodedTargetMessage = btoa(targetMessageArea.value);
    const encodedSourceLocale = btoa(sourceLocaleSelect.value);
    const encodedTargetLocale = btoa(targetLocaleSelect.value);
    const hash = `#${encodedSourceMessage}.${encodedTargetMessage}.${encodedSourceLocale}.${encodedTargetLocale}`
      .replaceAll("/", "_").replaceAll("+", "-").replaceAll("=", "");
    history.replaceState(null, "", hash);
  }

  function exampleButton(buttonId: string) {
    return () => {
      var clearTarget: boolean = true;
      switch (buttonId) {
        case "example_good": {
          sourceLocaleSelect.value = "en-US";
          sourceMessageArea.value =
     ".input {$numDays :number}\n\
.match $numDays\n\
one   {{{$numDays} day}}\n\
other {{{$numDays} days}}\n\
*     {{{$numDays} days}}";
          break;
        }
        case "example_czech": {
          sourceLocaleSelect.value = "cs-CZ";
          sourceMessageArea.value =
".input {$numDays :number}\n\
.match $numDays\n\
one   {{{$numDays} den}}\n\
few   {{{$numDays} dny}}\n\
many  {{{$numDays} dne}}\n\
other {{{$numDays} dni}}\n\
*     {{{$numDays} dní}}";
           break;
        }
        case "example_czech_bad": {
          sourceLocaleSelect.value = "cs-CZ";
          sourceMessageArea.value =
".input {$numDays :number}\n\
.match $numDays\n\
one   {{{$numDays} den}}\n\
few   {{{$numDays} dny}}\n\
*     {{{$numDays} dní}}";
          break;
       }
       case "example_czech_no_selectors": {
          sourceLocaleSelect.value = "cs-CZ";
          sourceMessageArea.value =
".input {$numDays :number}\n\
{{{$numDays}}}"
          break;
       }
       case "example_czech_no_plural_selectors": {
          sourceLocaleSelect.value = "en-US";
          sourceMessageArea.value =
".input {$numDays :func}\n\
.match $numDays\n\
one   {{{$numDays} day}}\n\
other {{{$numDays} days}}\n\
*     {{{$numDays} days}}";
          break;
       }
       case "example_czech_not_plural_category": {
          sourceLocaleSelect.value = "cs-CZ";
          sourceMessageArea.value =
".input {$numDays :number}\n\
.match $numDays\n\
one   {{{$numDays} den}}\n\
few   {{{$numDays} dny}}\n\
many  {{{$numDays} dne}}\n\
other {{{$numDays} dni}}\n\
boatloads {{{$numDays} dní}}\n\
*     {{{$numDays} dní}}";
          break;
       }
       case "example_czech_multiple_selectors": {
          sourceLocaleSelect.value = "cs-CZ";
          sourceMessageArea.value =
".input {$numDays :number}\n\
.input {$count :number}\n\
.match $numDays $count\n\
one  one   {{{$numDays} den}}\n\
one  few   {{{$numDays} den}}\n\
one  many  {{{$numDays} den}}\n\
one  other {{{$numDays} den}}\n\
few  one  {{{$numDays} dny}}\n\
few  few  {{{$numDays} dny}}\n\
few  many  {{{$numDays} dny}}\n\
few  other  {{{$numDays} dny}}\n\
many one {{{$numDays} dne}}\n\
many few {{{$numDays} dne}}\n\
many many {{{$numDays} dne}}\n\
many other {{{$numDays} dne}}\n\
other one {{{$numDays} dni}}\n\
other few {{{$numDays} dni}}\n\
other many {{{$numDays} dni}}\n\
other other {{{$numDays} dni}}\n\
* *    {{{$numDays} dní}}";
           break;
       }
       case "example_czech_multiple_selectors_bad": {
          sourceLocaleSelect.value = "cs-CZ";
          sourceMessageArea.value =
".input {$numDays :number}\n\
.input {$count :number}\n\
.match $numDays $count\n\
one  one   {{{$numDays} den}}\n\
one  few   {{{$numDays} den}}\n\
one  other {{{$numDays} den}}\n\
few  one  {{{$numDays} dny}}\n\
few  few  {{{$numDays} dny}}\n\
few  many  {{{$numDays} dny}}\n\
few  other  {{{$numDays} dny}}\n\
many one {{{$numDays} dne}}\n\
many few {{{$numDays} dne}}\n\
many other {{{$numDays} dne}}\n\
other one {{{$numDays} dni}}\n\
other few {{{$numDays} dni}}\n\
other many {{{$numDays} dni}}\n\
other other {{{$numDays} dni}}\n\
* *    {{{$numDays} dní}}";
          break;
       }
       case "example_czech_partial_wildcards": {
          sourceLocaleSelect.value = "cs-CZ";
          sourceMessageArea.value =
".input {$numDays :number}\n\
.input {$count :number}\n\
.match $numDays $count\n\
one  one   {{{$numDays} den}}\n\
one  few   {{{$numDays} den}}\n\
one  many  {{{$numDays} den}}\n\
one  other {{{$numDays} den}}\n\
few  *  {{{$numDays} dny}}\n\
many one {{{$numDays} dne}}\n\
many few {{{$numDays} dne}}\n\
many many {{{$numDays} dne}}\n\
many other {{{$numDays} dne}}\n\
other one {{{$numDays} dni}}\n\
other few {{{$numDays} dni}}\n\
other many {{{$numDays} dni}}\n\
other other {{{$numDays} dni}}\n\
* *    {{{$numDays} dní}}";
          break;
       }
       case "example_parse_error": {
          sourceLocaleSelect.value = "en-US";
          sourceMessageArea.value =
".input {$numDays :number}\n\
.atch $numDays\n\
one   {{{$numDays} day}}\n\
other {{{$numDays} days}}\n\
*     {{{$numDays} days}}";
          break;
       }
       case "example_czech_aliasing": {
          sourceLocaleSelect.value = "cs-CZ";
          sourceMessageArea.value =
".input {$numDays1 :number}\n\
.local $numDays = {$numDays1}\n\
.match $numDays\n\
one   {{{$numDays} den}}\n\
few   {{{$numDays} dny}}\n\
many  {{{$numDays} dne}}\n\
other {{{$numDays} dni}}\n\
*     {{{$numDays} dní}}";
        }
        case "example_placeholders": {
          console.log("1");
          clearTarget = false;
          sourceLocaleSelect.value = "en-US";
          targetLocaleSelect.value = "cs-CZ";
          sourceMessageArea.value =
".input {$numDays :number}\n\
.match $numDays\n\
one   {{{$numDays} day}}\n\
other {{{$numDays} days}}\n\
*     {{{$numDays} days}}\n";
          targetMessageArea.value =
".input {$numDays :number}\n\
.match $numDays\n\
one   {{{$numDays} den}}\n\
few   {{{$numDays} dny}}\n\
many  {{{$numDays} dne}}\n\
other {{numDays dni}}\n\
*     {{{$numDays} dní}}";
           break;
        }
        default:
           break;
      }
      if (clearTarget) {
        targetMessageArea.value = "";
      }
      onUpdate();
    }
  }

});
