import { type Hole, html } from "../lib/view";

export function shell({
  path,
  title,
  header,
  subheader,
  msg,
  content,
}: {
  path: string[];
  title: string;
  header: string;
  subheader: string | Hole;
  msg?: string | Hole;
  content: Hole;
}) {
  const errorClass = msg ? "error visible" : "error";
  const hasPrev = path.length > 0 && path[0] !== "login";
  let prevDest;
  if (hasPrev) {
    prevDest = `/${path.slice(0, -1).join("/")}`;
  }
  return html`<html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="/public/styles.css" />
    </head>
    <body>
      <div class="${errorClass}">${msg}</div>
      <div id="header">
        <h1><a href="/">${header}</a></h1>
        <div id="nav">
          ${hasPrev ? html`<a href="${prevDest}">Back</a>` : ""}
        </div>
        <p>${subheader}</p>
      </div>
      <div id="content">${content}</div>
    </body>
  </html>`;
}
