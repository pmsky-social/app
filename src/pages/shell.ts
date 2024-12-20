import { type Hole, html } from "../lib/view";

export function shell({
  title,
  header,
  subheader,
  content,
}: {
  title: string;
  header: string;
  subheader: string | Hole;
  content: Hole;
}) {
  return html`<html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="/public/styles.css" />
    </head>
    <body>
      <div class="error"></div>
      <div id="header">
        <h1>${header}</h1>
        <p>${subheader}</p>
      </div>
      <div id="content">${content}</div>
    </body>
  </html>`;
}
