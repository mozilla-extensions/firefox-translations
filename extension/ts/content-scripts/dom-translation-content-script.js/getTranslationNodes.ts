/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { hasTextForTranslation } from "./hasTextForTranslation";

export interface TranslationNode {
  content: HTMLElement;
  isTranslationRoot: boolean;
}

const isBlockFrameOrSubclass = (element: HTMLElement) => {
  // TODO: Make this generalize like the corresponding C code invoked by:
  /*
  nsIFrame* frame = childElement->GetPrimaryFrame();
  frame->IsBlockFrameOrSubclass();
  */
  const nodeTagName = element.tagName.toLowerCase();
  const blockLevelElementTagNames = [
    "address",
    "article",
    "aside",
    "blockquote",
    "canvas",
    "dd",
    "div",
    "dl",
    "dt",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "li",
    "main",
    "nav",
    "noscript",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "tfoot",
    "ul",
    "video",
  ];
  const result =
    (blockLevelElementTagNames.includes(nodeTagName) ||
      element.style.display === "block") &&
    element.style.display !== "inline";
  return result;
};

export const getTranslationNodes = (
  rootElement: HTMLElement,
  seenTranslationNodes: Node[] = [],
  limit = 15000,
): TranslationNode[] => {
  const translationNodes: TranslationNode[] = [];

  // Query child elements in order to explicitly skip the root element from being classified as a translation node
  const childElements = <HTMLCollectionOf<HTMLElement>>rootElement.children;
  for (let i = 0; i < limit && i < childElements.length; i++) {
    const childElement: HTMLElement = childElements[i];

    const tagName = childElement.tagName.toLowerCase();
    const isElementNode = childElement.nodeType === Node.ELEMENT_NODE;
    const isTextNode = childElement.nodeType === Node.TEXT_NODE;

    if (isTextNode) {
      console.warn(
        `We are not supposed to run into text nodes here. childElement.textContent: "${childElement.textContent}"`,
      );
      continue;
    }

    // Skip elements that usually contain non-translatable text content.
    if (
      [
        "script",
        "iframe",
        "frameset",
        "frame",
        "code",
        "noscript",
        "style",
        "svg",
        "math",
      ].includes(tagName)
    ) {
      continue;
    }

    const nodeHasTextForTranslation = hasTextForTranslation(
      childElement.textContent,
    );

    // Only empty or non-translatable content in this part of the tree
    if (!nodeHasTextForTranslation) {
      continue;
    }

    // An element is a translation node if it contains
    // at least one text node that has meaningful data
    // for translation
    const childChildTextNodes = Array.from(childElement.childNodes).filter(
      (childChildNode: Node) => childChildNode.nodeType === Node.TEXT_NODE,
    );
    const childChildTextNodesWithTextForTranslation = childChildTextNodes
      .map(textNode => textNode.textContent)
      .filter(hasTextForTranslation);
    const isTranslationNode =
      childChildTextNodesWithTextForTranslation.length > 0;

    if (isTranslationNode) {
      // At this point, we know we have a translation node at hand, but we need
      // to figure out it the node is a translation root or not
      let isTranslationRoot;

      // Block elements are translation roots
      isTranslationRoot = isBlockFrameOrSubclass(childElement);
      // If an element is not a block element, it still
      // can be considered a translation root if all ancestors
      // of this element are not translation nodes
      seenTranslationNodes.push(childElement);
      if (!isTranslationRoot) {
        // Walk up tree and check if an ancestor was a translation node
        let ancestorWasATranslationNode: boolean = false;
        for (
          let ancestor: Node = childElement.parentNode;
          ancestor;
          ancestor = ancestor.parentNode
        ) {
          if (seenTranslationNodes.includes(ancestor)) {
            ancestorWasATranslationNode = true;
            break;
          }
        }
        isTranslationRoot = !ancestorWasATranslationNode;
      }

      const translationNode = {
        content: childElement,
        isTranslationRoot,
      };

      translationNodes.push(translationNode);
    }

    // Now traverse any element children to find nested translation nodes
    if (childElement.firstElementChild) {
      const childTranslationNodes = getTranslationNodes(
        childElement,
        seenTranslationNodes,
        limit - translationNodes.length,
      );
      translationNodes.push(...childTranslationNodes);
    }
  }

  return translationNodes;
};
