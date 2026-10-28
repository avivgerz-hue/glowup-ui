// Minimal YAML frontmatter reader for SKILL.md files.
// Supports the subset the Agent Skills spec uses: top-level scalars
// (plain, single- or double-quoted, folded/literal blocks) and one level
// of nested string maps (e.g. `metadata:`). CI also runs the reference
// validator (skills-ref) for full YAML coverage.

export class FrontmatterError extends Error {}

function unquote(raw) {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
    return JSON.parse(value);
  }
  if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (/^["']/.test(value)) throw new FrontmatterError(`Unterminated quoted string: ${value}`);
  return value.replace(/\s+#.*$/, "");
}

export function splitFrontmatter(text) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new FrontmatterError("SKILL.md must start with a '---' frontmatter line");
  }
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) throw new FrontmatterError("Frontmatter is not closed with '---'");
  const after = normalized.slice(end + 4);
  if (after.length && !after.startsWith("\n")) {
    throw new FrontmatterError("Closing '---' must be on its own line");
  }
  return { yaml: normalized.slice(4, end), body: after.replace(/^\n/, "") };
}

export function parseYamlSubset(yaml) {
  const data = {};
  // Normalize CRLF (Windows checkouts) and a leading BOM before parsing lines.
  const lines = yaml.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) { i++; continue; }
    if (/^\s/.test(line)) throw new FrontmatterError(`Unexpected indentation: "${line}"`);
    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s+(.*))?$/);
    if (!match) throw new FrontmatterError(`Cannot parse line: "${line}"`);
    const [, key, rest = ""] = match;
    if (key in data) throw new FrontmatterError(`Duplicate key: ${key}`);
    i++;
    if (rest === "" ) {
      const map = {};
      while (i < lines.length && (/^\s+\S/.test(lines[i]) || !lines[i].trim())) {
        const child = lines[i];
        i++;
        if (!child.trim() || child.trim().startsWith("#")) continue;
        const cm = child.match(/^\s+([A-Za-z0-9_.-]+):\s*(.*)$/);
        if (!cm) throw new FrontmatterError(`Cannot parse nested line under ${key}: "${child}"`);
        map[cm[1]] = unquote(cm[2]);
      }
      data[key] = map;
    } else if (/^[>|][-+]?$/.test(rest.trim())) {
      const folded = rest.trim().startsWith(">");
      const block = [];
      while (i < lines.length && (/^\s+/.test(lines[i]) || !lines[i].trim())) {
        block.push(lines[i].trim());
        i++;
      }
      data[key] = (folded ? block.join(" ").replace(/\s+/g, " ") : block.join("\n")).trim();
    } else {
      data[key] = unquote(rest);
    }
  }
  return data;
}

export function parseSkillFile(text) {
  const { yaml, body } = splitFrontmatter(text);
  return { data: parseYamlSubset(yaml), body };
}
