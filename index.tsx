export const layout = "layout.vto";

export const title = "Validator";

export default function IndexPage() {
  return (
    <>
      <header class="relative h-24 z-30">
        <svg
          class="rotate-180 -z-10 absolute top-0 left-0"
          height="100%"
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 70"
          preserveAspectRatio="none"
          fill="url(#gradient)"
        >
          <linearGradient id="gradient">
            <stop style="stop-color: #1d4ed8" offset="0%" />
            <stop style="stop-color: #3b82f6" offset="100%" />
          </linearGradient>
          <rect width="1000" height="61" y="9" />
          <path d="M0 0 Q 500 10 1000 0 L 1000 10 L 0 10 Z" />
        </svg>
        <nav class="z-20 h-full">
          <div class="h-full flex justify-between items-center pb-1 px-8 max-w-screen-lg mx-auto">
            <div>
              <a
                href="/"
                class="text-white
         font-serif font-bold text-2xl hover:underline underline-offset-4"
              >
                MessageFormat 2
              </a>
              <span class="mx-2 text-white select-none">/</span>
              <span class="text-white text-lg">Validator</span>
            </div>

          </div>
        </nav>
      </header>

      <div class="grid grid-cols-2 px-8 mt-6 mb-12 mx-auto max-w-screen-lg gap-4">

        <div class="h-80 flex flex-col">
          <label for="message">
            <h2 class="text-xl font-bold font-serif px-2 pb-1 text-black">
              Message
            </h2>
          </label>
          <textarea
            id="message"
            class="w-full h-full resize-none font-mono p-4 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            placeholder="Type your message here..."
          >

          </textarea>

         <div class="flex gap-6 items-end">
          <div class="flex flex-col">
            <label
             for="locale"
             class="text-md font-bold font-serif px-2 text-blue-50"
            >
            <h2 class="text-xl font-bold font-serif px-2 pb-1 text-black">
               Locale
            </h2>
            </label>
            <select id="locale" class="w-52 p-2 rounded-lg bg-gray-100">
                  <option id="en-US">English (United States)</option>
                  <option disabled>Loading...</option>
            </select>
          </div>
        </div>

          <div
            id="message-errors"
            class="text-red-600 bg-red-50 p-4 mt-2 rounded-lg"
            hidden
          >
          </div>
        </div>

        <div class="col-span-2">
          <h2 class="text-xl font-bold font-serif px-2 pb-1 text-black">
            Plural validation result
          </h2>
          <div class="border rounded-md p-6 text-lg min-h-20" id="pluralValidation">
            Plurals used correctly
          </div>
          <pre
            id="output-errors"
            class="text-red-600 bg-red-50 p-4 mt-2 rounded-lg font-mono"
            hidden
          >
          </pre>
        </div>
      </div>

    </>
  );
}
