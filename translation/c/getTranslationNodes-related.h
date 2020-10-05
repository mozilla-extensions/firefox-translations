# dom/base/nsDOMWindowUtils.h

class nsTranslationNodeList final : public nsITranslationNodeList {
 public:
  nsTranslationNodeList() {
    mNodes.SetCapacity(1000);
    mNodeIsRoot.SetCapacity(1000);
    mLength = 0;
  }

  NS_DECL_ISUPPORTS
  NS_DECL_NSITRANSLATIONNODELIST

  void AppendElement(nsINode* aElement, bool aIsRoot) {
    mNodes.AppendElement(aElement);
    mNodeIsRoot.AppendElement(aIsRoot);
    mLength++;
  }

 private:
  ~nsTranslationNodeList() = default;

  nsTArray<nsCOMPtr<nsINode> > mNodes;
  nsTArray<bool> mNodeIsRoot;
  uint32_t mLength;
};
