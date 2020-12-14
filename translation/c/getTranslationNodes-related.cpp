# dom/base/nsDOMWindowUtils.cpp

      if (child->IsText() && child->GetAsText()->HasTextForTranslation()) {

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
