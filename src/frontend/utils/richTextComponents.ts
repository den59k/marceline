import type { Block, Style } from "vuewrite"

export const defaultDecorator = (style: Style) => {
  if (style.style === 'color') {
    return { style: `color: ${style.meta!.color};` }
  }
  if (style.style === 'bold') {
    return { tag: "b", class: "bold" }
  }
  if (style.style === "underline") {
    return { tag: "u", class: "underline" }
  }
  if (style.style === "italic") {
    return { tag: "i", class: "italic" }
  }
  if (style.style === "strikethrough") {
    return { tag: "s", class: "strikethrough" }
  }
  if (style.style === "code") {
    return { class: style.style }
  }
  if (style.style === 'link') {
    return { tag: "a", href: style.meta.url }
  }
}

export const defaultRenderer = (block: Block) => {
  if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'li') {
    return { tag: block.type }
  }
  if (block.type === 'callout') {
    return { class: "callout" }
  }
  return { tag: 'p' }
}

