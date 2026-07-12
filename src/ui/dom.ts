export function createElement(tagName: keyof HTMLElementTagNameMap, className: string, textContent = ''): HTMLElement {
  const element = document.createElement(tagName);

  element.className = className;

  if (textContent.length > 0) {
    element.textContent = textContent;
  }

  return element;
}
