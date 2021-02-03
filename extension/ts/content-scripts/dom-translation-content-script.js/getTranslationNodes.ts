/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { hasTextForTranslation } from "./hasTextForTranslation";

export interface TranslationNode {
  content: HTMLElement;
  isTranslationRoot: boolean;
}

export const getTranslationNodes = (
  rootElement: Element,
): TranslationNode[] => {
  const seenTranslationElements: Node[] = [];

  const translationNodes: TranslationNode[] = [];
  const limit = 15000;

  // Query child elements in order to explicitly skip the root element from being a translation node
  const childElements = <HTMLCollectionOf<HTMLElement>>(
    rootElement.getElementsByTagName("*")
  );

  for (let i = 0; i < limit && i < childElements.length; i++) {
    const content: HTMLElement = childElements[i];
    const tagName = content.tagName.toLowerCase();
    if (tagName === "html") {
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

    // An element is a translation node if it contains
    // at least one text node that has meaningful data
    // for translation
    for (
      let child: Node = content.firstChild;
      child;
      child = child.nextSibling
    ) {
      // console.log({child});
      if (
        child.nodeType === Node.TEXT_NODE &&
        hasTextForTranslation(child.textContent)
      ) {
        seenTranslationElements.push(content);

        // TODO: Verify this assumption from C to JS:
        /*
        nsIFrame* frame = content->GetPrimaryFrame();
        bool isTranslationRoot = frame && frame->IsBlockFrameOrSubclass();
        */
        const isBlockFrameOrSubclass = (node: HTMLElement) => {
          return (
            (["div", "li"].includes(content.tagName.toLowerCase()) ||
              node.style.display === "block") &&
            node.style.display !== "inline"
          );
        };

        let isTranslationRoot = isBlockFrameOrSubclass(content);

        if (!isTranslationRoot) {
          // If an element is not a block element, it still
          // can be considered a translation root if the parent
          // of this element didn't make it into the list of nodes
          // to be translated.
          let parentInList: boolean = false;
          const parent: Node = content.parentNode;
          if (parent) {
            parentInList = seenTranslationElements.includes(parent);
          }
          isTranslationRoot = !parentInList;
        }

        translationNodes.push({
          content,
          isTranslationRoot,
        });

        break;
      }
    }
  }

  return translationNodes;
};
