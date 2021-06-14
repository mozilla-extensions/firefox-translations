/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getTranslationNodes, TranslationNode } from "./getTranslationNodes";
import {
  TranslationItem,
  TranslationItem_NodePlaceholder,
  TranslationItemStructureElement,
} from "./TranslationItem";

export type TranslationDocumentTarget =
  | "translation"
  | "qeAnnotatedTranslation"
  | "original";

/**
 * This class represents a document that is being translated,
 * and it is responsible for parsing the document,
 * generating the data structures translation (the list of
 * translation items and roots), and managing the original
 * and translated texts on the translation items.
 *
 * @param document  The document to be translated
 */
export class TranslationDocument {
  public translatedFrom = "";
  public translatedTo = "";
  public translationError = false;
  public originalShown = true;
  public qualityEstimationShown = true;
  private nodeTranslationItemsMap: Map<Node, TranslationItem>;
  public readonly translationRoots: TranslationItem[];
  // Set temporarily to true during development to visually inspect which nodes have been processed and in which way
  public paintProcessedNodes: boolean = false;

  constructor(document: Document) {
    this.nodeTranslationItemsMap = new Map();
    this.translationRoots = [];
    this._init(document);
  }

  /**
   * Initializes the object and populates
   * the translation roots lists.
   *
   * @param document  The document to be translated
   */
  _init(document: Document) {
    // Get all the translation nodes in the document's body:
    // a translation node is a node from the document which
    // contains useful content for translation, and therefore
    // must be included in the translation process.
    const translationNodes: TranslationNode[] = getTranslationNodes(
      document.body,
    );
    console.info(
      `The document has a total of ${
        translationNodes.length
      } translation nodes, of which ${
        translationNodes.filter(tn => tn.isTranslationRoot).length
      } are translation roots`,
    );

    translationNodes.forEach((translationNode, index) => {
      const { content, isTranslationRoot } = translationNode;

      if (this.paintProcessedNodes) {
        content.style.backgroundColor = "darkorange";
      }

      // Create a TranslationItem object for this node.
      // This function will also add it to the this.translationRoots array.
      this._createItemForNode(content, index, isTranslationRoot);
    });

    // At first all translation roots are stored in the translation roots list, and only after
    // the process has finished we're able to determine which translation roots are
    // simple, and which ones are not.

    // A simple root is defined by a translation root with no children items, which
    // basically represents an element from a page with only text content
    // inside.

    // This distinction is useful for optimization purposes: we treat a
    // simple root as plain-text in the translation process and with that
    // we are able to reduce their data payload sent to the translation service.

    for (const translationRoot of this.translationRoots) {
      if (
        !translationRoot.children.length &&
        translationRoot.nodeRef instanceof Element &&
        translationRoot.nodeRef.childElementCount === 0
      ) {
        translationRoot.isSimleTranslationRoot = true;
        if (this.paintProcessedNodes) {
          translationRoot.nodeRef.style.backgroundColor = "orange";
        }
      }
    }
  }

  /**
   * Creates a TranslationItem object, which should be called
   * for each node returned by getTranslationNodes.
   *
   * @param node                The DOM node for this item.
   * @param id                  A unique, numeric id for this item.
   * @param isTranslationRoot   A boolean saying whether this item is a translation root.
   *
   * @returns           A TranslationItem object.
   */
  _createItemForNode(node, id, isTranslationRoot: boolean): TranslationItem {
    if (this.nodeTranslationItemsMap.has(node)) {
      return this.nodeTranslationItemsMap.get(node);
    }

    const item = new TranslationItem(node, id, isTranslationRoot);

    if (isTranslationRoot) {
      // Translation root items do not have a parent item.
      this.translationRoots.push(item);
    } else {
      // Other translation nodes have at least one ancestor which is a translation root
      let ancestorTranslationItem: TranslationItem;
      for (
        let ancestor: Node = node.parentNode;
        ancestor;
        ancestor = ancestor.parentNode
      ) {
        ancestorTranslationItem = this.nodeTranslationItemsMap.get(ancestor);
        if (ancestorTranslationItem) {
          ancestorTranslationItem.children.push(item);
          break;
        } else {
          // make intermediate ancestors link to the descendent translation item
          // so that it gets picked up on in generateOriginalStructureElements
          this.nodeTranslationItemsMap.set(ancestor, item);
        }
      }
    }

    this.nodeTranslationItemsMap.set(node, item);
    return item;
  }

  /**
   * Generate the markup that represents a TranslationItem object.
   * Besides generating the markup, it also stores a fuller representation
   * of the TranslationItem in the "original" field of the TranslationItem object,
   * which needs to be stored for later to be used in the "Show Original" functionality.
   * If this function had already been called for the given item (determined
   * by the presence of the "original" array in the item), the markup will
   * be regenerated from the "original" data instead of from the related
   * DOM nodes (because the nodes might contain translated data).
   *
   * @param item     A TranslationItem object
   *
   * @returns        A markup representation of the TranslationItem.
   */
  generateMarkupToTranslate(item: TranslationItem): string {
    if (!item.original) {
      item.original = this.generateOriginalStructureElements(item);
    }
    return regenerateMarkupToTranslateFromOriginal(item);
  }

  /**
   * Generates a fuller representation of the TranslationItem
   * @param item
   */
  generateOriginalStructureElements(
    item: TranslationItem,
  ): TranslationItemStructureElement[] {
    const original: TranslationItemStructureElement[] = [];

    if (item.isSimleTranslationRoot) {
      const text = item.nodeRef.firstChild.nodeValue.trim();
      original.push(text);
      return original;
    }

    let wasLastItemPlaceholder = false;

    for (const child of Array.from(item.nodeRef.childNodes)) {
      if (child.nodeType === child.TEXT_NODE) {
        const x = child.nodeValue;
        const hasLeadingWhitespace = x.length !== x.trimStart().length;
        const hasTrailingWhitespace = x.length !== x.trimEnd().length;
        if (x.trim() !== "") {
          const xWithNormalizedWhitespace = `${
            hasLeadingWhitespace ? " " : ""
          }${x.trim()}${hasTrailingWhitespace ? " " : ""}`;
          original.push(xWithNormalizedWhitespace);
          wasLastItemPlaceholder = false;
        }
        continue;
      }

      const objInMap = this.nodeTranslationItemsMap.get(child);
      if (objInMap && !objInMap.isTranslationRoot) {
        // If this childNode is present in the nodeTranslationItemsMap, it means
        // it's a translation node: it has useful content for translation.
        // In this case, we need to stringify this node.
        // However, if this item is a translation root, we should skip it here in this
        // object's child list (and just add a placeholder for it), because
        // it will be stringified separately for being a translation root.
        original.push(objInMap);
        objInMap.original = this.generateOriginalStructureElements(objInMap);
        wasLastItemPlaceholder = false;
      } else if (!wasLastItemPlaceholder) {
        // Otherwise, if this node doesn't contain any useful content,
        // or if it is a translation root itself, we can replace it with a placeholder node.
        // We can't simply eliminate this node from our string representation
        // because that could change the HTML structure (e.g., it would
        // probably merge two separate text nodes).
        // It's not necessary to add more than one placeholder in sequence;
        // we can optimize them away.
        original.push(new TranslationItem_NodePlaceholder());
        wasLastItemPlaceholder = true;
      }
    }
    return original;
  }

  /**
   * Changes the document to display its translated
   * content.
   */
  showTranslation() {
    this.originalShown = false;
    this.qualityEstimationShown = false;
    this._swapDocumentContent("translation");
  }

  /**
   * Changes the document to display its original
   * content.
   */
  showOriginal() {
    this.originalShown = true;
    this.qualityEstimationShown = false;
    this._swapDocumentContent("original");
    // TranslationTelemetry.recordShowOriginalContent();
  }

  /**
   * Changes the document to display the translation with quality estimation metadata
   * content.
   */
  showQualityEstimation() {
    this.originalShown = false;
    this.qualityEstimationShown = true;
    this._swapDocumentContent("qeAnnotatedTranslation");
  }

  /**
   * Swap the document with the resulting translation,
   * or back with the original content.
   */
  _swapDocumentContent(target: TranslationDocumentTarget) {
    (async () => {
      this.translationRoots
        .filter(
          translationRoot => translationRoot.currentDisplayMode !== target,
        )
        .forEach(translationRoot =>
          translationRoot.swapText(target, this.paintProcessedNodes),
        );
      // TODO: Make sure that the above does not lock the main event loop
      /*
      // Let the event loop breath on every 100 nodes
      // that are replaced.
      const YIELD_INTERVAL = 100;
      await Async.yieldingForEach(
        this.roots,
        root => root.swapText(target, this.paintProcessedNodes),
        YIELD_INTERVAL
      );
      */
    })();
  }

  async determineVisibilityOfTranslationRoots() {
    const { translationRoots } = this;

    // Short-circuit this process in case the document is empty, or else
    // it will hang, waiting for any visible elements
    if (translationRoots.length === 0) {
      return {
        translationRoots: [],
        translationRootsVisible: [],
        translationRootsVisibleInViewport: [],
      };
    }

    const elements = translationRoots.map(
      translationRoot => translationRoot.nodeRef,
    );
    const elementsVisibleInViewport = await getElementsVisibleInViewport(
      elements,
    );

    const translationRootsVisible = [];
    const translationRootsVisibleInViewport = [];
    for (let i = 0; i < translationRoots.length; i++) {
      const translationRoot = translationRoots[i];
      const visible = isElementVisible(translationRoot.nodeRef);
      if (visible) {
        translationRootsVisible.push(translationRoot);
      }
      const visibleInViewport = isElementVisibleInViewport(
        elementsVisibleInViewport,
        translationRoot.nodeRef,
      );
      if (visibleInViewport) {
        translationRootsVisibleInViewport.push(translationRoot);
      }
    }

    if (this.paintProcessedNodes) {
      translationRootsVisible.forEach(translationRoot => {
        translationRoot.nodeRef.style.color = "purple";
      });
      translationRootsVisibleInViewport.forEach(translationRoot => {
        translationRoot.nodeRef.style.color = "maroon";
      });
    }

    return {
      translationRoots,
      translationRootsVisible,
      translationRootsVisibleInViewport,
    };
  }
}

/**
 * Generate the translation markup for a given item.
 *
 * @param   item       A TranslationItem object.
 * @param   content    The inner content for this item.
 * @returns string     The outer HTML needed for translation
 *                     of this item.
 */
export function generateMarkupToTranslateForItem(
  item: TranslationItem,
  content,
): string {
  const localName = item.isTranslationRoot ? "div" : "b";
  return (
    "<" + localName + " id=n" + item.id + ">" + content + "</" + localName + ">"
  );
}

/**
 * Regenerate the markup that represents a TranslationItem object,
 * with data from its "original" array. The array must have already
 * been created by TranslationDocument.generateMarkupToTranslate().
 *
 * @param item     A TranslationItem object
 *
 * @returns        A markup representation of the TranslationItem.
 */
function regenerateMarkupToTranslateFromOriginal(
  item: TranslationItem & { original: any },
) {
  if (item.isSimleTranslationRoot) {
    return item.original[0];
  }

  let str = "";
  for (const child of item.original) {
    if (child instanceof TranslationItem) {
      str += regenerateMarkupToTranslateFromOriginal(child);
    } else if (child instanceof TranslationItem_NodePlaceholder) {
      str += "<br>";
    } else {
      str += child;
    }
  }

  return generateMarkupToTranslateForItem(item, str);
}

const isElementVisible = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  // Elements that are not visible will have a zero width/height bounding client rect
  return rect.width > 0 && rect.height > 0;
};

const isElementVisibleInViewport = (
  elementsVisibleInViewport: Node[],
  el: Node,
): boolean => {
  return !!elementsVisibleInViewport.filter($el => $el === el).length;
};

const getElementsVisibleInViewport = async (
  elements: HTMLElement[],
): Promise<Node[]> => {
  return new Promise(resolve => {
    const options = {
      threshold: 0.0,
    };

    const callback: IntersectionObserverCallback = (entries, $observer) => {
      // console.debug("InteractionObserver callback", entries.length, entries);
      const elementsInViewport = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => entry.target);
      $observer.disconnect();
      resolve(elementsInViewport);
    };

    const observer = new IntersectionObserver(callback, options);
    elements.forEach(el => observer.observe(el));
  });
};
