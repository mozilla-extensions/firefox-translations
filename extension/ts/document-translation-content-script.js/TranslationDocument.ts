/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { getTranslationNodes } from "./getTranslationNodes";
import {
  TranslationItem,
  TranslationItem_NodePlaceholder,
} from "./TranslationItem";

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
  private translatedFrom = "";
  private translatedTo = "";
  private translationError = false;
  private originalShown = true;
  private itemsMap;
  private roots;

  constructor(document) {
    this.itemsMap = new Map();
    this.roots = [];
    this._init(document);
  }

  /**
   * Initializes the object and populates
   * the roots lists.
   *
   * @param document  The document to be translated
   */
  _init(document) {
    // Get all the translation nodes in the document's body:
    // a translation node is a node from the document which
    // contains useful content for translation, and therefore
    // must be included in the translation process.
    let nodeList = getTranslationNodes(document.body);
    console.log({ nodeList });

    let length = nodeList.length;

    for (let i = 0; i < length; i++) {
      let node = nodeList.item(i);
      let isRoot = nodeList.isTranslationRootAtIndex(i);

      // Create a TranslationItem object for this node.
      // This function will also add it to the this.roots array.
      this._createItemForNode(node, i, isRoot);
    }

    // At first all roots are stored in the roots list, and only after
    // the process has finished we're able to determine which roots are
    // simple, and which ones are not.

    // A simple root is defined by a root with no children items, which
    // basically represents an element from a page with only text content
    // inside.

    // This distinction is useful for optimization purposes: we treat a
    // simple root as plain-text in the translation process and with that
    // we are able to reduce their data payload sent to the translation service.

    for (let root of this.roots) {
      if (!root.children.length && root.nodeRef.childElementCount == 0) {
        root.isSimpleRoot = true;
      }
    }
  }

  /*
   */
  getOwnerDocument() {
    for (let root of this.roots) {
      if (root.nodeRef.ownerDocument) {
        return root.nodeRef.ownerDocument;
      }
    }
  }
  /*
   */

  /**
   * Creates a TranslationItem object, which should be called
   * for each node returned by getTranslationNodes.
   *
   * @param node        The DOM node for this item.
   * @param id          A unique, numeric id for this item.
   * @parem isRoot      A boolean saying whether this item is a root.
   *
   * @returns           A TranslationItem object.
   */
  _createItemForNode(node, id, isRoot): TranslationItem {
    if (this.itemsMap.has(node)) {
      return this.itemsMap.get(node);
    }

    let item = new TranslationItem(node, id, isRoot);

    if (isRoot) {
      // Root items do not have a parent item.
      this.roots.push(item);
    } else {
      let parentItem = this.itemsMap.get(node.parentNode);
      if (parentItem) {
        parentItem.children.push(item);
      }
    }

    this.itemsMap.set(node, item);
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
  generateTextForItem(item: TranslationItem & { original: any }) {
    if (item.original) {
      return regenerateTextFromOriginalHelper(item);
    }

    if (item.isSimpleRoot) {
      let text = item.nodeRef.firstChild.nodeValue.trim();
      item.original = [text];
      return text;
    }

    let str = "";
    item.original = [];
    let wasLastItemPlaceholder = false;

    for (let child of item.nodeRef.childNodes) {
      if (child.nodeType == child.TEXT_NODE) {
        let x = child.nodeValue.trim();
        if (x != "") {
          item.original.push(x);
          str += x;
          wasLastItemPlaceholder = false;
        }
        continue;
      }

      let objInMap = this.itemsMap.get(child);
      if (objInMap && !objInMap.isRoot) {
        // If this childNode is present in the itemsMap, it means
        // it's a translation node: it has useful content for translation.
        // In this case, we need to stringify this node.
        // However, if this item is a root, we should skip it here in this
        // object's child list (and just add a placeholder for it), because
        // it will be stringfied separately for being a root.
        item.original.push(objInMap);
        str += this.generateTextForItem(objInMap);
        wasLastItemPlaceholder = false;
      } else if (!wasLastItemPlaceholder) {
        // Otherwise, if this node doesn't contain any useful content,
        // or if it is a root itself, we can replace it with a placeholder node.
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
    this._swapDocumentContent("translation");
  }

  /**
   * Changes the document to display its original
   * content.
   */
  showOriginal() {
    this.originalShown = true;
    this._swapDocumentContent("original");
  }

  /**
   * Swap the document with the resulting translation,
   * or back with the original content.
   *
   * @param target   A string that is either "translation"
   *                 or "original".
   */
  _swapDocumentContent(target) {
    (async () => {
      /* TODO: Reimplement
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
function generateTranslationHtmlForItem(item, content): string {
  let localName = item.isRoot ? "div" : "b";
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
function regenerateTextFromOriginalHelper(item) {
  if (item.isSimpleRoot) {
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
