import type { ReactNode } from "react";

/** Renders *phrase* as bold for AI strings that use single-asterisk emphasis */
export function parseAsteriskBold(text: string): ReactNode {
  if (!text.includes("*")) return text;
  const nodes: ReactNode[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(<strong key={`ab-${k++}`}>{m[1]}</strong>);
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length === 0 ? text : <>{nodes}</>;
}
