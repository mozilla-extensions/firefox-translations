# dom/base/nsDOMWindowUtils.cpp

  nsTHashtable<nsPtrHashKey<nsIContent>> translationNodesHash(500);
  RefPtr<nsTranslationNodeList> list = new nsTranslationNodeList;

    // An element is a translation node if it contains
    // at least one text node that has meaningful data
    // for translation
    for (nsIContent* child = content->GetFirstChild(); child;
         child = child->GetNextSibling()) {
      if (child->IsText() && child->GetAsText()->HasTextForTranslation()) {
        translationNodesHash.PutEntry(content);

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

        list->AppendElement(content, isTranslationRoot);
        --limit;
        break;
      }
    }

# dom/base/Text.cpp

bool Text::HasTextForTranslation() {
  if (mText.Is2b()) {
    // The fragment contains non-8bit characters which means there
    // was at least one "interesting" character to trigger non-8bit.
    return true;
  }

  if (HasFlag(NS_CACHED_TEXT_IS_ONLY_WHITESPACE) &&
      HasFlag(NS_TEXT_IS_ONLY_WHITESPACE)) {
    return false;
  }

  const char* cp = mText.Get1b();
  const char* end = cp + mText.GetLength();

  unsigned char ch;
  for (; cp < end; cp++) {
    ch = *cp;

    // These are the characters that are letters
    // in the first 256 UTF-8 codepoints.
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
        (ch >= 192 && ch <= 214) || (ch >= 216 && ch <= 246) || (ch >= 248)) {
      return true;
    }
  }

  return false;
}
