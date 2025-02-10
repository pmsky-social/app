import { ProposalType } from "#/db/types";
import { type Hole, html } from "#/lib/view";
import { shell } from "./shell";

type Props = {
  proposalTypes: ProposalType[];
  allowedLabelValues: string[];
  error?: string;
};

export function createProposal(props: Props) {
  return shell({
    path: ["createProposal"],
    title: "Create Proposal",
    header: "PMsky",
    subheader: html`Welcome to
      <a href="//pmsky.social"><em>AfternoonSky</em></a>`,
    content: content(props),
  });
}

function friendly(type: ProposalType) {
  switch (type) {
    case ProposalType.POST_LABEL:
      return "Label a post";
    case ProposalType.ALLOWED_USER:
      return "Invite a user";
    default:
      throw new Error(`Unknown proposal type: ${type}`);
  }
}

function content({ error, allowedLabelValues, proposalTypes }: Props): Hole {
  return html`
    <div class="container">
      ${error && html`<div class="error visible">${error}</div>`}
      <div class="card" x-data="{ proposalType: '' }">
        <form
          class="createProposal"
          action="/proposal"
          method="post"
          class="create-proposal"
        >
          <select name="type" value="label" x-model="proposalType">
            <option value="">Select a type of proposal</option>
            ${proposalTypes.map(
              (type) => html`<option value="${type}">${friendly(type)}</option>`
            )}
          </select>

          ${ProposePostLabelComponents(allowedLabelValues)}
          ${ProposeAllowedUserComponents()}
          <button x-show="proposalType !== ''" type="submit">
            Submit Proposal
          </button>
        </form>
      </div>
    </div>
  `;
}

function labelValueOption(labelValue: string) {
  return html`<option value="${labelValue}">${labelValue}</option>`;
}

function ProposePostLabelComponents(allowedLabelValues: string[]) {
  return html`
    <div x-show="proposalType === 'post_label'">
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
      <select type="text" name="label" placeholder="Choose a label" required>
        ${allowedLabelValues.map(labelValueOption)}
      </select>
      <script>
        document.addEventListener("DOMContentLoaded", () => {
          const cancelButton = document.getElementById("cancel-button");
          const inputContainer = document.getElementById("input-container");
          const urlInput = document.getElementById("subject-input");
          const previewContainer = document.getElementById("preview-container");
          const oembedPreview = document.getElementById("oembed-preview");
          const oembedHtmlInput = document.getElementById("oembedHtml");

          cancelButton.addEventListener("click", () => {
            inputContainer.style.display = "block";
            previewContainer.style.display = "none";
            oembedPreview.innerHTML = "";
            oembedHtmlInput.value = "";
            urlInput.value = "";
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
    </div>
  `;
}

function ProposeAllowedUserComponents() {
  return html`<p x-show="proposalType === 'allowed_user'">
    <input type="text" name="handle" placeholder="Enter a handle" required />
  </p>`;
}
