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

document.addEventListener("DOMContentLoaded", () => {
  const localeSelect = document.getElementById("locale") as HTMLSelectElement;
  const messageArea = document.getElementById("message") as HTMLTextAreaElement;
  const messageErrors = document.getElementById(
    "message-errors",
  ) as HTMLDivElement;
  const pluralValidationArea = document.getElementById("pluralValidation") as HTMLDivElement;
  const outputErrors = document.getElementById(
    "output-errors",
  ) as HTMLDivElement;

  localeSelect.addEventListener("change", onUpdate);
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
});
