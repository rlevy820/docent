/* docent — frontend */

function esc(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSpace(space, depth) {
  var doors = space.doors
    .map(function (door, i) {
      return '<a href="#" class="door" data-depth="' + depth + '" data-door="' + i + '">' + esc(door.label) + "</a>";
    })
    .join("\n      ");

  return (
    '<div class="space" data-depth="' + depth + '">' +
    "\n    <p>" + esc(space.content) + "</p>" +
    (doors ? '\n    <div class="doors">\n      ' + doors + "\n    </div>" : "") +
    "\n  </div>"
  );
}

var walkthrough = document.getElementById("walkthrough");

// Load the root space
fetch("/api/root")
  .then(function (res) { return res.json(); })
  .then(function (space) {
    walkthrough.innerHTML = renderSpace(space, 0);
  })
  .catch(function () {
    walkthrough.innerHTML = '<p class="loading">Something went wrong.</p>';
  });

// Handle door clicks
walkthrough.addEventListener("click", async function (e) {
  if (!e.target.classList.contains("door") || e.target.classList.contains("visited")) return;
  e.preventDefault();

  var link = e.target;
  var depth = parseInt(link.getAttribute("data-depth"));
  var door = parseInt(link.getAttribute("data-door"));

  // Mark this door as visited
  link.classList.add("visited");

  // Remove any spaces deeper than this door's depth
  var spaces = document.querySelectorAll(".space");
  for (var i = spaces.length - 1; i >= 0; i--) {
    if (parseInt(spaces[i].getAttribute("data-depth")) > depth) {
      spaces[i].remove();
    }
  }

  // Show loading
  var loading = document.createElement("p");
  loading.className = "loading";
  loading.textContent = "...";
  walkthrough.appendChild(loading);

  try {
    var res = await fetch("/api/door?depth=" + depth + "&door=" + door);
    var space = await res.json();
    loading.remove();
    walkthrough.insertAdjacentHTML("beforeend", renderSpace(space, depth + 1));
  } catch (err) {
    loading.textContent = "Something went wrong.";
  }
});
