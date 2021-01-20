import { hasTextForTranslation } from "./hasTextForTranslation";

interface TranslationNode {
  content: Node;
  isTranslationRoot: boolean;
}

interface NodeListInterface {
  translationNodes: TranslationNode[];
  length: number;
  item: (i) => Node;
  isTranslationRootAtIndex: (i) => boolean;
}

class NodeList implements NodeListInterface {
  public readonly translationNodes: TranslationNode[];
  constructor(translationNodes) {
    this.translationNodes = translationNodes;
  }
  get length() {
    return this.translationNodes.length;
  }
  item(i) {
    return this.translationNodes[i].content;
  }
  isTranslationRootAtIndex(i) {
    return this.translationNodes[i].isTranslationRoot;
  }
}

export const getTranslationNodes = (rootElement: Element): NodeList => {
  const translationNodesMap = new Map();

  const translationNodes: TranslationNode[] = [];
  const limit = 15000;

  // Query child elements in order to explicitly skip the root tag from being a translation node
  const childElements: HTMLCollectionOf<Element> = rootElement.getElementsByTagName(
    "*",
  );

  for (let i = 0; i < limit && i < childElements.length; i++) {
    const content: Element = childElements[i];
    if (content.tagName === "html") {
      continue;
    }

    // Skip elements that usually contain non-translatable text content.
    if (
      [
        "SCRIPT",
        "IFRAME",
        "FRAMESET",
        "FRAME",
        "CODE",
        "NOSCRIPT",
        "STYLE",
      ].includes(content.tagName)
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
        // TODO: Verify this assumption from C to JS:
        /*
        nsIFrame* frame = content->GetPrimaryFrame();
        bool isTranslationRoot = frame && frame->IsBlockFrameOrSubclass();
        */
        let isTranslationRoot = ["DIV"].includes(content.tagName);

        if (!isTranslationRoot) {
          // If an element is not a block element, it still
          // can be considered a translation root if the parent
          // of this element didn't make into the list of nodes
          // to be translated.
          let parentInList: boolean = false;
          const parent: Node = content.parentNode;
          if (parent) {
            parentInList = translationNodesMap.has(parent);
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

  return new NodeList(translationNodes);
};
