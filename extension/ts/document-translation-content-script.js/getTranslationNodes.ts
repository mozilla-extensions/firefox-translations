interface TranslationNode {
  content: Element;
  isTranslationRoot: boolean;
}

interface NodeListInterface {
  length: number;
  item: (i) => TranslationNode;
  isTranslationRootAtIndex: (i) => boolean;
}

class NodeList implements NodeListInterface {
  private translationNodes: TranslationNode[];
  constructor(translationNodes) {
    this.translationNodes = translationNodes;
  }
  get length() {
    return 0;
  }
  item(i) {
    return this.translationNodes[i];
  }
  isTranslationRootAtIndex(i) {
    return this.translationNodes[i].isTranslationRoot;
  }
}

export const getTranslationNodes = (rootElement: Element): NodeList => {
  // nsTHashtable<nsPtrHashKey<nsIContent>> translationNodesHash(500);

  const translationNodesHash: {
    [k: number]: string;
  } = {};
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
        "script",
        "iframe",
        "frameset",
        "frame",
        "code",
        "noscript",
        "style",
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
        child.nodeType ===
        Node.TEXT_NODE /* && child->GetAsText()->HasTextForTranslation() */
      ) {
        /*
        nsIFrame* frame = content->GetPrimaryFrame();
        bool isTranslationRoot = frame && frame->IsBlockFrameOrSubclass();
        if (!isTranslationRoot) {
          // If an element is not a block element, it still
          // can be considered a translation root if the parent
          // of this element didn't make into the list of nodes
          // to be translated.
          bool parentInList = false;
          nsIContent* parent = content->GetParent();
          if (parent) {
            parentInList = translationNodesHash.Contains(parent);
          }
          isTranslationRoot = !parentInList;
        }
        */

        const isTranslationRoot = false;

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
