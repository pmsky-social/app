import { type Hole, html } from "#/lib/view";
import { shell } from "./shell";

type Props = {
  allowedLabelValues: string[];
  error?: string;
};

export function createLabel(props: Props) {
  return shell({
    path: ["createLabel"],
    title: "Create Label",
    header: "PMsky",
    subheader: html`Welcome to
      <a href="//pmsky.social"><em>AfternoonSky</em></a>`,
    content: content(props),
  });
}

function content({ error, allowedLabelValues }: Props): Hole {
  return html`
    <div class="container">
      ${error && html`<div class="error visible">${error}</div>`}
      <div class="card">
        <form
          class="createLabel"
          action="/label"
          method="post"
          class="create-label"
        >
          <div id="input-container">
            <input
              type="text"
              id="subject-input"
              name="subject"
              placeholder="Paste a link from Bsky..."
              hx-post="/api/embedPost"
              hx-trigger="input changed delay:200ms"
              hx-target="#oembed-preview"
              required
            />
          </div>

          <div id="preview-container" style="display: none;">
            <div id="oembed-preview"></div>
            <button type="button" class="secondary" id="cancel-button">
              Remove post
            </button>
          </div>

          <input type="hidden" name="oembedHtml" id="oembedHtml" />
          <select
            type="text"
            name="label"
            placeholder="Choose a label"
            required
          >
            ${allowedLabelValues.map(labelValueOption)}
          </select>
          <button type="submit">Create</button>
        </form>
      </div>
    </div>
    <script>
      document.addEventListener("DOMContentLoaded", () => {
        const cancelButton = document.getElementById("cancel-button");
        const inputContainer = document.getElementById("input-container");
        const previewContainer = document.getElementById("preview-container");
        const oembedPreview = document.getElementById("oembed-preview");
        const oembedHtmlInput = document.getElementById("oembedHtml");

        cancelButton.addEventListener("click", () => {
          inputContainer.style.display = "block";
          previewContainer.style.display = "none";
          oembedPreview.innerHTML = "";
          oembedHtmlInput.value = "";
          inputContainer.value = "";
        });

        // Automatically show preview container when HTML is loaded
        oembedPreview.addEventListener("htmx:afterSwap", () => {
          if (event.target.id === "oembed-preview") {
            // Show the preview container
            inputContainer.style.display = "none";
            previewContainer.style.display = "block";

            // Update the hidden input with the fetched HTML
            oembedHtmlInput.value = oembedPreview.innerHTML;

            // Find and execute <script> tags in the response
            const scripts = oembedPreview.querySelectorAll("script");
            scripts.forEach((script) => {
              const newScript = document.createElement("script");
              newScript.textContent = script.textContent;
              oembedPreview.appendChild(newScript);
              oembedPreview.removeChild(newScript); // Clean up after execution
            });
          }
        });
      });
    </script>
  `;
}

function labelValueOption(labelValue: string) {
  return html`<option value="${labelValue}">${labelValue}</option>`;
}
