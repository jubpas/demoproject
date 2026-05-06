const fs = require("fs");
const lines = fs.readFileSync("task.md", "utf-8").split("\n");

// Print context around potential duplicate sections
console.log("=== File structure ===");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("## ") || line.includes("=== ") || line.trim() === "" || line.startsWith("- ") && (line.includes("ทำเสร็จ") || line.includes("## Main") || line.includes("อัปเดต") || line.includes("กำลัง") || line.includes("✅"))) {
    // Print a window around key markers
  }
}

// Find all section headers and "ทำเสร็จแล้ว" sections
const markers = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("## ") || lines[i].startsWith("##")) {
    markers.push({ line: i + 1, text: lines[i] });
  }
  if (lines[i].trim() === "ทำเสร็จแล้ว:") {
    markers.push({ line: i + 1, text: lines[i], type: "duplicate" });
  }
  if (lines[i].trim() === "อัปเดตล้าสุด:") {
    markers.push({ line: i + 1, text: lines[i] });
  }
}

console.log("Markers found:");
markers.forEach(m => console.log(`  Line ${m.line}: ${m.text}`));

// Show exact lines 44-97 for context
console.log("\n=== Lines 44-97 (potential duplicate section) ===");
for (let i = 43; i <= 96 && i < lines.length; i++) {
  console.log(`[${(i+1).toString().padStart(3, ' ')}] ${lines[i]}`);
}

console.log("\n=== Lines 1-44 (first section) ===");
for (let i = 0; i <= 42 && i < lines.length; i++) {
  console.log(`[${(i+1).toString().padStart(3, ' ')}] ${lines[i]}`);
}

console.log("\n=== Lines 97-139 (after second duplicate) ===");
for (let i = 96; i <= 138 && i < lines.length; i++) {
  console.log(`[${(i+1).toString().padStart(3, ' ')}] ${lines[i]}`);
}
