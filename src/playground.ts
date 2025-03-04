import locales from "npm:locale-codes@1.3.1";
import { formatMessageToHTML, MessageFormat } from "./_utils/message_format.ts";
import { parseMessage, validateMessage, Message } from "./_utils/validate_message.ts";

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
   "example_czech_aliasing"];

document.addEventListener("DOMContentLoaded", () => {
  const localeSelect = document.getElementById("locale") as HTMLSelectElement;
  const exampleCzechButton = document.getElementById("example_czech") as HTMLButtonElement;
  const messageArea = document.getElementById("message") as HTMLTextAreaElement;
  const messageErrors = document.getElementById(
    "message-errors",
  ) as HTMLDivElement;
  const pluralValidationArea = document.getElementById("pluralValidation") as HTMLDivElement;
  const outputErrors = document.getElementById(
    "output-errors",
  ) as HTMLDivElement;

  localeSelect.addEventListener("change", onUpdate);
  exampleButtons.forEach((buttonId) => {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    button.addEventListener('click', exampleButton(buttonId))
  });
  messageArea.addEventListener("input", onUpdate);

  localeSelect.innerHTML = "";

  for (const { locale, name, region } of supportedLocales) {
    const option = document.createElement("option");
    option.value = locale.baseName;
    option.textContent = `${name} (${region})`;
    if (locale.baseName === "en-US") {
      option.selected = true;
    }
    localeSelect.appendChild(option);
  }

  const hash = globalThis.location.hash.slice(1);
  try {
    if (hash) {
      const [encodedMessage, encodedData, encodedLocale] = hash.split(".");
      const message = atob(encodedMessage);
      const locale = atob(encodedLocale);
      messageArea.value = message;
      localeSelect.value = locale;
      onUpdate();
    }
  } catch (_) {
    // Ignore errors
  }

  function onUpdate() {
    const locale: string = localeSelect.value;
    const message = messageArea.value;

    messageErrors.textContent = "";
    messageErrors.hidden = true;
    pluralValidationArea.textContent = "";
    outputErrors.textContent = "";
    outputErrors.hidden = true;

    let mf2: Message | null = null;
    try {
      mf2 = parseMessage(message);
    } catch (e) {
      messageErrors.textContent = (e as Error).message;
      messageErrors.hidden = false;
    }

    if (mf2 !== null) {
       const validatorOutput = validateMessage(locale, mf2);
       pluralValidationArea.textContent = validatorOutput;
       pluralValidationArea.hidden = false;
    }

    outputErrors.hidden = true;
    const encodedMessage = btoa(messageArea.value);
    const encodedLocale = btoa(localeSelect.value);
    const hash = `#${encodedMessage}.${encodedLocale}`
      .replaceAll("/", "_").replaceAll("+", "-").replaceAll("=", "");
    history.replaceState(null, "", hash);
  }

  function exampleButton(buttonId: string) {
    return () => {
      switch (buttonId) {
        case "example_good": {
          localeSelect.value = "en-US";
          messageArea.value =
     ".input {$numDays :number}\n\
.match $numDays\n\
one   {{{$numDays} day}}\n\
other {{{$numDays} days}}\n\
*     {{{$numDays} days}}";
          break;
        }
        case "example_czech": {
          localeSelect.value = "cs-CZ";
          messageArea.value =
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
          localeSelect.value = "cs-CZ";
          messageArea.value =
".input {$numDays :number}\n\
.match $numDays\n\
one   {{{$numDays} den}}\n\
few   {{{$numDays} dny}}\n\
*     {{{$numDays} dní}}";
          break;
       }
       case "example_czech_no_selectors": {
          localeSelect.value = "cs-CZ";
          messageArea.value =
".input {$numDays :number}\n\
{{{$numDays}}}"
          break;
       }
       case "example_czech_no_plural_selectors": {
          localeSelect.value = "en-US";
          messageArea.value =
".input {$numDays :func}\n\
.match $numDays\n\
one   {{{$numDays} day}}\n\
other {{{$numDays} days}}\n\
*     {{{$numDays} days}}";
          break;
       }
       case "example_czech_not_plural_category": {
          localeSelect.value = "cs-CZ";
          messageArea.value =
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
          localeSelect.value = "cs-CZ";
          messageArea.value =
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
          localeSelect.value = "cs-CZ";
          messageArea.value =
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
          localeSelect.value = "cs-CZ";
          messageArea.value =
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
          localeSelect.value = "en-US";
          messageArea.value =
".input {$numDays :number}\n\
.atch $numDays\n\
one   {{{$numDays} day}}\n\
other {{{$numDays} days}}\n\
*     {{{$numDays} days}}";
          break;
       }
       case "example_czech_aliasing": {
          localeSelect.value = "cs-CZ";
          messageArea.value =
".input {$numDays1 :number}\n\
.local $numDays = {$numDays1}\n\
.match $numDays\n\
one   {{{$numDays} den}}\n\
few   {{{$numDays} dny}}\n\
many  {{{$numDays} dne}}\n\
other {{{$numDays} dni}}\n\
*     {{{$numDays} dní}}";
        }
        default:
           break;
      }
      onUpdate();
    }
  }

});
