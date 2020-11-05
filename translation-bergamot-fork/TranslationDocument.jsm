  getOwnerDocument() {
    for (let root of this.roots) {
      if (root.nodeRef.ownerDocument) {
        return root.nodeRef.ownerDocument;
      }
    }
  },

// function parseResultNode(item, node) {
    } else if (child.id == "QE-ANNOTATED"){
      // A workaround to show translated text with Quality Estimate annotations
      // inplace (i.e. in the same webpage replacing the original text) and
      // enabling seemless switch between showing original and translated text
      // back and forth.
      item.translation.push(child);
// }

        /* The replaced chunk of code:
        // A trailing and a leading space must be preserved because
        // they are meaningful in HTML.
        let preSpace = /^\s/.test(curNode.nodeValue) ? " " : "";
        let endSpace = /\s$/.test(curNode.nodeValue) ? " " : "";

        curNode.nodeValue = preSpace + targetItem + endSpace;
        curNode = getNextSiblingSkippingEmptyTextNodes(curNode);
        */
        // A workaround to show translated text with Quality Estimate annotations
        // inplace (i.e. in the same webpage replacing the original text) and
        // enabling seemless switch between showing original and translated text
        // back and forth.
        if (target == "original") {
          // A trailing and a leading space must be preserved because
          // they are meaningful in HTML.
          let preSpace = /^\s/.test(curNode.nodeValue) ? " " : "";
          let endSpace = /\s$/.test(curNode.nodeValue) ? " " : "";
          curNode.nodeValue = preSpace + targetItem + endSpace;

          for (let node of curNode.parentNode.childNodes) {
            if (node.id == "QE-ANNOTATED") {
              // There should be only 1 such node. Remove the curNode from the
              // parent's children and replace the qe-annotated node with it to
              // maintain the right order in original DOM tree of the document.
              curNode = curNode.parentNode.removeChild(curNode);
              node.parentNode.replaceChild(curNode, node);
            }
          }
          curNode = getNextSiblingSkippingEmptyTextNodes(curNode);
        }
        else {
          let nextSibling = getNextSiblingSkippingEmptyTextNodes(curNode);
          // Replace the text node with the qe-annotated node to maintain the
          // right order in original DOM tree of the document.
          curNode.parentNode.replaceChild(targetItem, curNode);
          curNode = nextSibling;
        }
