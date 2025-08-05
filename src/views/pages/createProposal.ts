import { ProposalType } from "#/db/types";
import { type Hole, html } from "#/lib/view";
import { metaLink } from "../components/buttons";
import { shell } from "./shell";

type Props = {
  initProposalType?: ProposalType | undefined;
  proposalTypes: ProposalType[];
  allowedLabelValues: string[];
  error?: string;
};

export function createProposal(props: Props) {
  return shell({
    path: ["createProposal"],
    title: "Create Proposal",
    content: content(props),
  });
}

function friendly(type: ProposalType) {
  switch (type) {
    case ProposalType.LABEL:
      return "Label a post";
    case ProposalType.ALLOWED_USER:
      return "Invite a user";
    default:
      throw new Error(`Unknown proposal type: ${type}`);
  }
}

function content({
  error,
  allowedLabelValues,
  proposalTypes,
  initProposalType,
}: Props): Hole {
  const init = initProposalType || "";
  const xData = { proposalType: init };
  return html`
    <div class="container">
      ${error && html`<div class="error visible">${error}</div>`}
      <div>${metaLink(true)}</div>
      <div class="card" x-data="${JSON.stringify(xData)}">
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
    <div x-show="proposalType === 'label'">
      <p class="create-help-text">
        Propose a label for a given post. This will submit a proposal to the
        <i>Main</i> feed, where users can agree or disagree with the proposed
        label. Those votes will be published as AT proto records, allowing
        labelers to incorporate those votes into their decision-making.
      </p>
      <div id="input-container">
        <input
          type="text"
          id="subject-input"
          name="subject"
          placeholder="Paste a link from Bsky..."
          autofocus
          hx-post="/api/embedPost"
          hx-trigger="input changed delay:200ms"
          hx-target="#oembed-preview"
        />
      </div>

      <div id="preview-container" style="display: none;">
        <div id="oembed-preview"></div>
        <button type="button" class="secondary" id="cancel-button">
          Remove post
        </button>
      </div>

      <input type="hidden" name="oembedHtml" id="oembedHtml" />
      <select type="text" name="label" placeholder="Choose a label">
        <option value="">Select a label</option>
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
  return html`<div x-show="proposalType === 'allowed_user'">
    <p class="create-help-text">
      Invite a user by their handle (eg alice.bsky.social). This will create a
      proposal in the <i>Meta</i> feed. If the proposal has a non-negative
      score, the user will be allowed to login.
    </p>
    <input
      autofocus
      name="handle"
      type="text"
      name="handle"
      placeholder="Enter a handle"
      autocomplete="off"
      spellcheck="false"
      autocorrect="off"
    />
  </div>`;
}
