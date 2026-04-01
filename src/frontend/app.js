/* docent — frontend */

function esc(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderWalkthrough(walkthrough) {
  var html = '<h1 class="project-name">' + esc(walkthrough.name) + '</h1>';
  html += '<p class="project-what">' + esc(walkthrough.what) + '</p>';
  html += '<hr class="divider">';

  walkthrough.sections.forEach(function (section) {
    // Split content on double newlines into paragraphs
    var paragraphs = section.content
      .split(/\n\n+/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean);

    html += '<div class="section">';
    paragraphs.forEach(function (p) {
      html += '<p>' + esc(p) + '</p>';
    });
    html += '</div>';
  });

  return html;
}

var walkthrough = document.getElementById("walkthrough");

fetch("/api/walkthrough")
  .then(function (res) {
    if (!res.ok) throw new Error("Server error");
    return res.json();
  })
  .then(function (data) {
    walkthrough.innerHTML = renderWalkthrough(data);
  })
  .catch(function () {
    walkthrough.innerHTML = '<p class="error">Something went wrong. Check the terminal for details.</p>';
  });
