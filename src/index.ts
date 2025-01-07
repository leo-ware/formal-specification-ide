// Data Structures
type TextRange = {
  start: number;
  end: number;
  text: string;
};

type TextLabel = {
  label: string;
  ranges: TextRange[];
};

type TextMapping = {
  label: string;
  lhsRanges: TextRange[];
  rhsRanges: TextRange[];
};

interface AnnotationsData {
  mappings: TextMapping[];
  lhsLabels: TextLabel[];
  rhsLabels: TextLabel[];
}

// ---------------------------------------------------------------------
// Utility function to fetch data from a specific example folder.
// ---------------------------------------------------------------------
async function loadData(folderName: string) {
  const basePath = `/data/${folderName}`;

  // Fetch all in parallel
  const [lhsText, rhsText, annotations] = await Promise.all([
    fetch(`${basePath}/lhs.txt`).then((res) => res.text()),
    fetch(`${basePath}/rhs.txt`).then((res) => res.text()),
    fetch(`${basePath}/annotations.json`).then((res) => res.json()),
  ]);

  return { lhsText, rhsText, annotations: annotations as AnnotationsData };
}

// ---------------------------------------------------------------------
// Highlighting logic
// ---------------------------------------------------------------------
function highlightRanges(containerId: string, ranges: TextRange[]) {
  const container = document.getElementById(containerId)!;
  const text = container.innerText;
  let highlightedText = "";
  let currentIndex = 0;

  ranges.forEach(({ start, end }) => {
    highlightedText += text.substring(currentIndex, start);
    highlightedText += `<span class="highlight">${text.substring(start, end)}</span>`;
    currentIndex = end;
  });

  highlightedText += text.substring(currentIndex);
  container.innerHTML = highlightedText;
}

function clearHighlights(containerId: string) {
  const container = document.getElementById(containerId)!;
  container.innerText = container.dataset.originalText || container.innerText;
}

// ---------------------------------------------------------------------
// Rendering Annotations
// ---------------------------------------------------------------------
function renderMappings(mappings: TextMapping[]) {
  const mappingsPanel = document.getElementById("mappings-panel")!;

  // Clear existing content if needed
  mappingsPanel.innerHTML = `<div class="header">Mappings</div>`;

  mappings.forEach((mapping) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="cell label">${mapping.label}</div>
      <div class="cell">${mapping.lhsRanges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
      <div class="cell label">${mapping.label}</div>
      <div class="cell">${mapping.rhsRanges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
    `;

    row.addEventListener("mouseover", () => {
      highlightRanges("lhs-text-content", mapping.lhsRanges);
      highlightRanges("rhs-text-content", mapping.rhsRanges);
    });

    row.addEventListener("mouseout", () => {
      clearHighlights("lhs-text-content");
      clearHighlights("rhs-text-content");
    });

    mappingsPanel.appendChild(row);
  });
}

function renderLabels(panelId: string, labels: TextLabel[], textContainerId: string) {
  const panel = document.getElementById(panelId)!;

  // Clear existing content if needed
  panel.innerHTML = `<div class="header">${panelId.includes("lhs") ? "LHS Labels" : "RHS Labels"}</div>`;

  labels.forEach((label) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="cell label">${label.label}</div>
      <div class="cell">${label.ranges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
    `;

    row.addEventListener("mouseover", () => {
      highlightRanges(textContainerId, label.ranges);
    });

    row.addEventListener("mouseout", () => {
      clearHighlights(textContainerId);
    });

    panel.appendChild(row);
  });
}

// ---------------------------------------------------------------------
// Main initialization
// ---------------------------------------------------------------------
async function main() {
  // Choose which example folder to load.
  // You could make this dynamic (query params, user selection, etc.).
  const folderName = "simpleText";

  // Load the data
  const { lhsText, rhsText, annotations } = await loadData(folderName);

  // Put the text in the DOM
  const lhsContainer = document.getElementById("lhs-text-content")!;
  const rhsContainer = document.getElementById("rhs-text-content")!;
  lhsContainer.innerText = lhsText;
  rhsContainer.innerText = rhsText;

  // Store original text for clearing highlights
  lhsContainer.dataset.originalText = lhsText;
  rhsContainer.dataset.originalText = rhsText;

  // IMPORTANT: fill the "text" field for each range using lhsText/rhsText
  // because your JSON only has {start, end}, but we need the substring.
  // This mutates the objects in-place.
  annotations.mappings.forEach((m) => {
    m.lhsRanges.forEach((r) => (r.text = lhsText.substring(r.start, r.end)));
    m.rhsRanges.forEach((r) => (r.text = rhsText.substring(r.start, r.end)));
  });
  annotations.lhsLabels.forEach((lbl) => {
    lbl.ranges.forEach((r) => (r.text = lhsText.substring(r.start, r.end)));
  });
  annotations.rhsLabels.forEach((lbl) => {
    lbl.ranges.forEach((r) => (r.text = rhsText.substring(r.start, r.end)));
  });

  // Render everything
  renderMappings(annotations.mappings);
  renderLabels("lhs-labels-panel", annotations.lhsLabels, "lhs-text-content");
  renderLabels("rhs-labels-panel", annotations.rhsLabels, "rhs-text-content");
}

// Run the main function on page load
main();
