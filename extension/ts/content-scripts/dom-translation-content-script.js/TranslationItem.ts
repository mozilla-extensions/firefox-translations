/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TranslationDocumentTarget } from "./TranslationDocument";

export type TranslationItemStructureElement =
  | string
  | TranslationItem
  | TranslationItem_NodePlaceholder;

/**
 * This class represents an item for translation. It's basically our
 * wrapper class around a node returned by getTranslationNode, with
 * more data and structural information on it.
 *
 * At the end of the translation process, besides the properties below,
 * a TranslationItem will contain two other properties: one called "original"
 * and one called "translation". They are twin objects, one which reflect
 * the structure of that node in its original state, and the other in its
 * translated state.
 *
 * The "original" array is generated in the
 * TranslationDocument.generateMarkupToTranslate function,
 * and the "translation" array is generated when the translation results
 * are parsed.
 *
 * They are both arrays, which contain a mix of strings and references to
 * child TranslationItems. The references in both arrays point to the * same *
 * TranslationItem object, but they might appear in different orders between the
 * "original" and "translation" arrays.
 *
 * An example:
 *
 *  English: <div id="n1">Welcome to <b id="n2">Mozilla's</b> website</div>
 *  Portuguese: <div id="n1">Bem vindo a pagina <b id="n2">da Mozilla</b></div>
 *
 *  TranslationItem n1 = {
 *    id: 1,
 *    original: ["Welcome to", ptr to n2, "website"]
 *    translation: ["Bem vindo a pagina", ptr to n2]
 *  }
 *
 *  TranslationItem n2 = {
 *    id: 2,
 *    original: ["Mozilla's"],
 *    translation: ["da Mozilla"]
 *  }
 */
export class TranslationItem {
  public isTranslationRoot = false;
  public isSimleTranslationRoot = false;
  public nodeRef: HTMLElement;
  public id;
  public children: TranslationItem[] = [];
  public translatedMarkup;
  public translation: TranslationItemStructureElement[];
  private qeAnnotatedTranslation;
  public original: TranslationItemStructureElement[];
  public currentDisplayMode: TranslationDocumentTarget;

  constructor(node: HTMLElement, id, isTranslationRoot: boolean) {
    this.nodeRef = node;
    this.id = id;
    this.isTranslationRoot = isTranslationRoot;
  }

  toString() {
    let rootType = "";
    if (this.isTranslationRoot) {
      if (this.isSimleTranslationRoot) {
        rootType = " (simple root)";
      } else {
        rootType = " (non simple root)";
      }
    }
    return (
      "[object TranslationItem: <" +
      this.nodeRef.toString() +
      ">" +
      rootType +
      "]"
    );
  }

  /**
   * This function will parse the result of the translation of one translation
   * item. If this item was a simple root, all we sent was a plain-text version
   * of it, so the result is also straightforward text.
   *
   * For non-simple roots, we sent a simplified HTML representation of that
   * node, and we'll first parse that into an HTML doc and then call the
   * parseResultNode helper function to parse it.
   *
   * While parsing, the result is stored in the "translation" field of the
   * TranslationItem, which will be used to display the final translation when
   * all items are finished. It remains stored too to allow back-and-forth
   * switching between the "Show Original" and "Show Translation" functions.
   *
   * @param translatedMarkup    A string with the textual result received from the translation engine,
   *                            which can be plain-text or a serialized HTML doc.
   */
  parseTranslationResult(translatedMarkup: string) {
    this.translatedMarkup = translatedMarkup;

    if (this.isSimleTranslationRoot) {
      // If translation contains HTML entities, we need to convert them.
      // It is because simple roots expect a plain text result.
      if (
        this.isSimleTranslationRoot &&
        translatedMarkup.match(/&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/gi)
      ) {
        const doc = new DOMParser().parseFromString(
          translatedMarkup,
          "text/html",
        );
        translatedMarkup = doc.body.firstChild.nodeValue;
      }

      this.translation = [translatedMarkup];
      return;
    }

    const domParser = new DOMParser();

    const doc = domParser.parseFromString(translatedMarkup, "text/html");
    this.translation = [];
    parseResultNode(this, doc.body.firstChild, "translation");
  }

  /**
   * Note: QE-annotated translation results are never plain text nodes, despite that
   * the original translation item may be a simple translation root.
   * This wreaks havoc.
   * @param qeAnnotatedTranslatedMarkup
   */
  parseQeAnnotatedTranslationResult(qeAnnotatedTranslatedMarkup: string) {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(
      qeAnnotatedTranslatedMarkup,
      "text/html",
    );
    this.qeAnnotatedTranslation = [];
    parseResultNode(this, doc.body.firstChild, "qeAnnotatedTranslation");
  }

  /**
   * This function finds a child TranslationItem
   * with the given id.
   * @param id        The id to look for, in the format "n#"
   * @returns         A TranslationItem with the given id, or null if
   *                  it was not found.
   */
  getChildById(id: string) {
    for (const child of this.children) {
      const childId = "n" + child.id;
      if (childId === id) {
        return child;
      }
    }
    return null;
  }

  /**
   * Swap the text of this TranslationItem between
   * its original and translated states.
   */
  swapText(target: TranslationDocumentTarget, paintProcessedNodes: boolean) {
    swapTextForItem(this, target, paintProcessedNodes);
  }
}

/**
 * This object represents a placeholder item for translation. It's similar to
 * the TranslationItem class, but it represents nodes that have no meaningful
 * content for translation. These nodes will be replaced by "<br>" in a
 * translation request. It's necessary to keep them to use it as a mark
 * for correct positioning and splitting of text nodes.
 */
export class TranslationItem_NodePlaceholder {
  static toString() {
    return "[object TranslationItem_NodePlaceholder]";
  }
}

/**
 * Helper function to parse a HTML doc result.
 * How it works:
 *
 * An example result string is:
 *
 * <div id="n1">Hello <b id="n2">World</b> of Mozilla.</div>
 *
 * For an element node, we look at its id and find the corresponding
 * TranslationItem that was associated with this node, and then we
 * walk down it repeating the process.
 *
 * For text nodes we simply add it as a string.
 */
function parseResultNode(
  item: TranslationItem,
  node: Node,
  target: TranslationDocumentTarget,
) {
  try {
    const into = item[target];
    // @ts-ignore
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        into.push(child.nodeValue);
      } else if (child.localName === "br") {
        into.push(new TranslationItem_NodePlaceholder());
      } else if (
        child.dataset &&
        typeof child.dataset.translationQeScore !== "undefined"
      ) {
        // handle the special case of quality estimate annotated nodes
        into.push(child);
      } else {
        const translationRootChild = item.getChildById(child.id);
        if (translationRootChild) {
          into.push(translationRootChild);
          translationRootChild[target] = [];
          parseResultNode(translationRootChild, child, target);
        } else {
          console.warn(
            `Result node's (belonging to translation item with id ${item.id}) child node (child.id: ${child.id}) lacks an associated translation root child`,
            { item, node, child },
          );
        }
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 * Helper function to swap the text of a TranslationItem
 * between its original and translated states.
 * How it works:
 *
 * The function iterates through the target array (either the `original` or
 * `translation` array from the TranslationItem), while also keeping a pointer
 * to a current position in the child nodes from the actual DOM node that we
 * are modifying. This pointer is moved forward after each item of the array
 * is translated. If, at any given time, the pointer doesn't match the expected
 * node that was supposed to be seen, it means that the original and translated
 * contents have a different ordering, and thus we need to adjust that.
 *
 * A full example of the reordering process, swapping from Original to
 * Translation:
 *
 *    Original (en): <div>I <em>miss</em> <b>you</b></div>
 *
 * Translation (fr): <div><b>Tu</b> me <em>manques</em></div>
 *
 * Step 1:
 *   pointer points to firstChild of the DOM node, textnode "I "
 *   first item in item.translation is [object TranslationItem <b>]
 *
 *   pointer does not match the expected element, <b>. So let's move <b> to the
 *   pointer position.
 *
 *   Current state of the DOM:
 *     <div><b>you</b>I <em>miss</em> </div>
 *
 * Step 2:
 *   pointer moves forward to nextSibling, textnode "I " again.
 *   second item in item.translation is the string " me "
 *
 *   pointer points to a text node, and we were expecting a text node. Match!
 *   just replace the text content.
 *
 *   Current state of the DOM:
 *     <div><b>you</b> me <em>miss</em> </div>
 *
 * Step 3:
 *   pointer moves forward to nextSibling, <em>miss</em>
 *   third item in item.translation is [object TranslationItem <em>]
 *
 *   pointer points to the expected node. Match! Nothing to do.
 *
 * Step 4:
 *   all items in this item.translation were transformed. The remaining
 *   text nodes are cleared to "", and domNode.normalize() removes them.
 *
 *   Current state of the DOM:
 *     <div><b>you</b> me <em>miss</em></div>
 *
 * Further steps:
 *   After that, the function will visit the child items (from the visitStack),
 *   and the text inside the <b> and <em> nodes will be swapped as well,
 *   yielding the final result:
 *
 *     <div><b>Tu</b> me <em>manques</em></div>
 */
function swapTextForItem(
  item: TranslationItem,
  target: TranslationDocumentTarget,
  paintProcessedNodes: boolean,
) {
  // visitStack is the stack of items that we still need to visit.
  // Let's start the process by adding the translation root item.
  const visitStack = [item];

  if (paintProcessedNodes) {
    item.nodeRef.style.border = "1px solid maroon";
  }
  while (visitStack.length) {
    const curItem: TranslationItem = visitStack.shift();

    if (paintProcessedNodes) {
      item.nodeRef.style.border = "1px solid yellow";
    }

    const domNode = curItem.nodeRef;
    if (!domNode) {
      // Skipping this item due to a missing node.
      continue;
    }

    if (!curItem[target]) {
      // Translation not found for this item. This could be due to
      // the translation not yet being available from the translation engine
      // For example, if a translation was broken in various
      // chunks, and not all of them has completed, the items from that
      // chunk will be missing its "translation" field.
      if (paintProcessedNodes) {
        curItem.nodeRef.style.border = "1px solid red";
      }
      continue;
    }

    domNode.normalize();

    if (paintProcessedNodes) {
      curItem.nodeRef.style.border = "1px solid green";
    }

    // curNode points to the child nodes of the DOM node that we are
    // modifying. During most of the process, while the target array is
    // being iterated (in the for loop below), it should walk together with
    // the array and be pointing to the correct node that needs to modified.
    // If it's not pointing to it, that means some sort of node reordering
    // will be necessary to produce the correct translation.
    // Note that text nodes don't need to be reordered, as we can just replace
    // the content of one text node with another.
    //
    // curNode starts in the firstChild...
    let curNode: ChildNode = domNode.firstChild;
    if (paintProcessedNodes && curNode instanceof HTMLElement) {
      curNode.style.border = "1px solid blue";
    }

    // ... actually, let's make curNode start at the first useful node (either
    // a non-blank text node or something else). This is not strictly necessary,
    // as the reordering algorithm would correctly handle this case. However,
    // this better aligns the resulting translation with the DOM content of the
    // page, avoiding cases that would need to be unnecessarily reordered.
    //
    // An example of how this helps:
    //
    // ---- Original: <div>                <b>Hello </b> world.</div>
    //                       ^textnode 1      ^item 1      ^textnode 2
    //
    // - Translation: <div><b>Hallo </b> Welt.</div>
    //
    // Transformation process without this optimization:
    //   1 - start pointer at textnode 1
    //   2 - move item 1 to first position inside the <div>
    //
    //       Node now looks like: <div><b>Hello </b>[         ][ world.]</div>
    //                                         textnode 1^       ^textnode 2
    //
    //   3 - replace textnode 1 with " Welt."
    //   4 - clear remaining text nodes (in this case, textnode 2)
    //
    // Transformation process with this optimization:
    //   1 - start pointer at item 1
    //   2 - item 1 is already in position
    //   3 - replace textnode 2 with " Welt."
    //
    // which completely avoids any node reordering, and requires only one
    // text change instead of two (while also leaving the page closer to
    // its original state).
    while (
      curNode &&
      curNode.nodeType === Node.TEXT_NODE &&
      curNode.nodeValue.trim() === ""
    ) {
      curNode = curNode.nextSibling;
    }

    // Now let's walk through all items in the `target` array of the
    // TranslationItem. This means either the TranslationItem.original or
    // TranslationItem.translation array.
    for (const targetItem of curItem[target]) {
      if (targetItem instanceof TranslationItem) {
        // If the array element is another TranslationItem object, let's
        // add it to the stack to be visited.
        visitStack.push(targetItem);

        const targetNode = targetItem.nodeRef;

        // If the node is not in the expected position, let's reorder
        // it into position...
        if (
          curNode !== targetNode &&
          // ...unless the page has reparented this node under a totally
          // different node (or removed it). In this case, all bets are off
          // on being able to do anything correctly, so it's better not to
          // bring back the node to this parent.
          // @ts-ignore
          targetNode.parentNode === domNode
        ) {
          // We don't need to null-check curNode because insertBefore(..., null)
          // does what we need in that case: reorder this node to the end
          // of child nodes.
          domNode.insertBefore(targetNode, curNode);
          curNode = targetNode;
        }

        // Move pointer forward. Since we do not add empty text nodes to the
        // list of translation items, we must skip them here too while
        // traversing the DOM in order to get better alignment between the
        // text nodes and the translation items.
        if (curNode) {
          curNode = getNextSiblingSkippingEmptyTextNodes(curNode);
        }
      } else if (targetItem instanceof TranslationItem_NodePlaceholder) {
        // If the current item is a placeholder node, we need to move
        // our pointer "past" it, jumping from one side of a block of
        // elements + empty text nodes to the other side. Even if
        // non-placeholder elements exists inside the jumped block,
        // they will be pulled correctly later in the process when the
        // targetItem for those nodes are handled.

        while (
          curNode &&
          (curNode.nodeType !== Node.TEXT_NODE ||
            curNode.nodeValue.trim() === "")
        ) {
          curNode = curNode.nextSibling;
        }
      } else {
        // Finally, if it's a text item, we just need to find the next
        // text node to use. Text nodes don't need to be reordered, so
        // the first one found can be used.
        while (curNode && curNode.nodeType !== Node.TEXT_NODE) {
          curNode = curNode.nextSibling;
        }

        // If none was found and we reached the end of the child nodes,
        // let's create a new one.
        if (!curNode) {
          // We don't know if the original content had a space or not,
          // so the best bet is to create the text node with " " which
          // will add one space at the beginning and one at the end.
          curNode = domNode.appendChild(
            domNode.ownerDocument.createTextNode(" "),
          );
        }

        if (target === "translation") {
          // A trailing and a leading space must be preserved because
          // they are meaningful in HTML.
          const preSpace = /^\s/.test(curNode.nodeValue) ? " " : "";
          const endSpace = /\s$/.test(curNode.nodeValue) ? " " : "";
          curNode.nodeValue = preSpace + targetItem + endSpace;
        } else {
          curNode.nodeValue = targetItem;
        }

        if (["original", "translation"].includes(target)) {
          // Workaround necessary when switching "back" from QE display
          // since quality estimated annotated nodes
          // replaced the simple text nodes of the original document
          // @ts-ignore
          for (const child of curNode.parentNode.childNodes) {
            if (
              child.dataset &&
              typeof child.dataset.translationQeScore !== "undefined"
            ) {
              // There should be only 1 such node. Remove the curNode from the
              // parent's children and replace the qe-annotated node with it to
              // maintain the right order in original DOM tree of the document.
              curNode = curNode.parentNode.removeChild(curNode);
              child.parentNode.replaceChild(curNode, child);
            }
          }

          curNode = getNextSiblingSkippingEmptyTextNodes(curNode);
        } else if (target === "qeAnnotatedTranslation") {
          const nextSibling = getNextSiblingSkippingEmptyTextNodes(curNode);
          // Replace the text node with the qe-annotated node to maintain the
          // right order in original DOM tree of the document.
          curNode.parentNode.replaceChild(targetItem, curNode);
          curNode = nextSibling;
        }
      }
    }

    // The translated version of a node might have less text nodes than its
    // original version. If that's the case, let's clear the remaining nodes.
    if (curNode) {
      clearRemainingNonEmptyTextNodesFromElement(curNode);
    }

    // And remove any garbage "" nodes left after clearing.
    domNode.normalize();

    // Mark the translation item as displayed in the requested target
    curItem.currentDisplayMode = target;

    if (paintProcessedNodes) {
      curItem.nodeRef.style.border = "2px solid green";
    }
  }
}

function getNextSiblingSkippingEmptyTextNodes(startSibling) {
  let item = startSibling.nextSibling;
  while (
    item &&
    item.nodeType === Node.TEXT_NODE &&
    item.nodeValue.trim() === ""
  ) {
    item = item.nextSibling;
  }
  return item;
}

function clearRemainingNonEmptyTextNodesFromElement(startSibling) {
  let item = startSibling;
  while (item) {
    if (item.nodeType === Node.TEXT_NODE && item.nodeValue !== "") {
      item.nodeValue = "";
    }
    item = item.nextSibling;
  }
}
