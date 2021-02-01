/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { getTranslationNodes, TranslationNode } from "./getTranslationNodes";
import {
  TranslationItem,
  TranslationItem_NodePlaceholder,
} from "./TranslationItem";

export type translationDocumentTarget =
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

    for (let translationRoot of this.translationRoots) {
      if (
        !translationRoot.children.length &&
        translationRoot.nodeRef instanceof Element &&
        translationRoot.nodeRef.childElementCount == 0
      ) {
        translationRoot.isSimleTranslationRoot = true;
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

    let item = new TranslationItem(node, id, isTranslationRoot);

    if (isTranslationRoot) {
      // Translation root items do not have a parent item.
      this.translationRoots.push(item);
    } else {
      let parentItem: TranslationItem = this.nodeTranslationItemsMap.get(
        node.parentNode,
      );
      if (parentItem) {
        parentItem.children.push(item);
      }
    }

    this.nodeTranslationItemsMap.set(node, item);
    return item;
  }

  /**
   * Generate the text string that represents a TranslationItem object.
   * Besides generating the string, it's also stored in the "original"
   * field of the TranslationItem object, which needs to be stored for
   * later to be used in the "Show Original" functionality.
   * If this function had already been called for the given item (determined
   * by the presence of the "original" array in the item), the text will
   * be regenerated from the "original" data instead of from the related
   * DOM nodes (because the nodes might contain translated data).
   *
   * @param item     A TranslationItem object
   *
   * @returns        A string representation of the TranslationItem.
   */
  generateTextForItem(item: TranslationItem): string {
    if (item.original) {
      return regenerateTextFromOriginalHelper(item);
    }

    if (item.isSimleTranslationRoot) {
      let text = item.nodeRef.firstChild.nodeValue.trim();
      item.original = [text];
      return text;
    }

    let str = "";
    item.original = [];
    let wasLastItemPlaceholder = false;

    for (let child of Array.from(item.nodeRef.childNodes)) {
      if (child.nodeType === child.TEXT_NODE) {
        let x = child.nodeValue.trim();
        if (x !== "") {
          item.original.push(x);
          str += x;
          wasLastItemPlaceholder = false;
        }
        continue;
      }

      let objInMap = this.nodeTranslationItemsMap.get(child);
      if (objInMap && !objInMap.isTranslationRoot) {
        // If this childNode is present in the nodeTranslationItemsMap, it means
        // it's a translation node: it has useful content for translation.
        // In this case, we need to stringify this node.
        // However, if this item is a translation root, we should skip it here in this
        // object's child list (and just add a placeholder for it), because
        // it will be stringfied separately for being a translation root.
        item.original.push(objInMap);
        str += this.generateTextForItem(objInMap);
        wasLastItemPlaceholder = false;
      } else if (!wasLastItemPlaceholder) {
        // Otherwise, if this node doesn't contain any useful content,
        // or if it is a translation root itself, we can replace it with a placeholder node.
        // We can't simply eliminate this node from our string representation
        // because that could change the HTML structure (e.g., it would
        // probably merge two separate text nodes).
        // It's not necessary to add more than one placeholder in sequence;
        // we can optimize them away.
        item.original.push(TranslationItem_NodePlaceholder);
        str += "<br>";
        wasLastItemPlaceholder = true;
      }
    }

    return generateTranslationHtmlForItem(item, str);
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
  _swapDocumentContent(target: translationDocumentTarget) {
    (async () => {
      this.translationRoots.forEach(translationRoot =>
        translationRoot.swapText(target),
      );
      // TODO: Make sure that the above does not lock the main event loop
      /*
      // Let the event loop breath on every 100 nodes
      // that are replaced.
      const YIELD_INTERVAL = 100;
      await Async.yieldingForEach(
        this.roots,
        root => root.swapText(target),
        YIELD_INTERVAL
      );
      */
    })();
  }
}

/**
 * Generate the outer HTML representation for a given item.
 *
 * @param   item       A TranslationItem object.
 * @param   content    The inner content for this item.
 * @returns string     The outer HTML needed for translation
 *                     of this item.
 */
export function generateTranslationHtmlForItem(
  item: TranslationItem,
  content,
): string {
  let localName = item.isTranslationRoot ? "div" : "b";
  return (
    "<" + localName + " id=n" + item.id + ">" + content + "</" + localName + ">"
  );
}

/**
 * Regenerate the text string that represents a TranslationItem object,
 * with data from its "original" array. The array must have already
 * been created by TranslationDocument.generateTextForItem().
 *
 * @param item     A TranslationItem object
 *
 * @returns        A string representation of the TranslationItem.
 */
function regenerateTextFromOriginalHelper(
  item: TranslationItem & { original: any },
) {
  if (item.isSimleTranslationRoot) {
    return item.original[0];
  }

  let str = "";
  for (let child of item.original) {
    if (child instanceof TranslationItem) {
      str += regenerateTextFromOriginalHelper(child);
    } else if (child === TranslationItem_NodePlaceholder) {
      str += "<br>";
    } else {
      str += child;
    }
  }

  return generateTranslationHtmlForItem(item, str);
}
