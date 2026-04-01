/* docent — frontend */

function esc(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Replaces {id} placeholders in a sentence with clickable feature links.
 * e.g. "Docent lets you {point-at-folder} and {read-explanation}."
 */
function renderSentence(sentence, features) {
  var featureMap = {};
  features.forEach(function (f) { featureMap[f.id] = f; });

  return sentence.replace(/\{([^}]+)\}/g, function (match, id) {
    var feature = featureMap[id];
    if (!feature) return match;
    return '<a href="#" class="feature-link" data-id="' + esc(id) + '">' + esc(feature.name) + '</a>';
  });
}

function renderPage(data) {
  var fl = data.featureList;
  var features = fl.features;

  var html = '<h1 class="project-name">' + esc(data.name) + '</h1>';
  html += '<p class="project-what">' + esc(data.what) + '</p>';
  html += '<hr class="divider">';

  html += '<div class="intro">';
  html += '<p class="intro-sentence">' + renderSentence(fl.userSentence, features) + '</p>';
  html += '<p class="intro-sentence">' + renderSentence(fl.codeSentence, features) + '</p>';
  html += '</div>';

  // Hidden detail panels, one per feature
  features.forEach(function (f) {
    html += '<div class="feature-detail" id="detail-' + esc(f.id) + '" hidden>';
    html += '<p>' + esc(f.detail) + '</p>';
    html += '</div>';
  });

  return html;
}

var walkthrough = document.getElementById("walkthrough");
var openFeatureId = null;

fetch("/api/walkthrough")
  .then(function (res) {
    if (!res.ok) throw new Error("Server error");
    return res.json();
  })
  .then(function (data) {
    walkthrough.innerHTML = renderPage(data);
  })
  .catch(function () {
    walkthrough.innerHTML = '<p class="error">Something went wrong. Check the terminal for details.</p>';
  });

// Handle feature link clicks
walkthrough.addEventListener("click", function (e) {
  var link = e.target.closest(".feature-link");
  if (!link) return;
  e.preventDefault();

  var id = link.getAttribute("data-id");
  var detail = document.getElementById("detail-" + id);
  if (!detail) return;

  // If this feature is already open, close it
  if (openFeatureId === id) {
    detail.hidden = true;
    link.classList.remove("active");
    openFeatureId = null;
    return;
  }

  // Close any previously open feature
  if (openFeatureId) {
    var prev = document.getElementById("detail-" + openFeatureId);
    if (prev) prev.hidden = true;
    var prevLink = walkthrough.querySelector('.feature-link[data-id="' + openFeatureId + '"]');
    if (prevLink) prevLink.classList.remove("active");
  }

  // Open this feature — insert detail panel immediately after the paragraph containing the link
  var para = link.closest("p");
  para.parentNode.insertBefore(detail, para.nextSibling);
  detail.hidden = false;
  link.classList.add("active");
  openFeatureId = id;
});