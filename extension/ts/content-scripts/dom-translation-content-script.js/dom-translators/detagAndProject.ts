interface DetaggedString {
  originalString: string;
  tokens: NodeToken[];
  plainString: string;
}

interface NodeToken {
  type: "word" | "tag" | "whitespace";
  textRepresentation: string;
}

export const detag = (originalString: string): DetaggedString => {
  // console.info("detag", { originalString });

  const originalStringDoc = new DOMParser().parseFromString(
    originalString,
    "text/html",
  );
  // console.debug("originalStringDoc.body", originalStringDoc.body);

  const tokens = serializeNodeIntoTokens(originalStringDoc.body);
  // console.debug({ tokens });

  const plainString = originalStringDoc.body.textContent;

  return {
    originalString,
    tokens,
    plainString,
  };
};

function serializeNodeIntoTokens(node: Node): NodeToken[] {
  const tokens: NodeToken[] = [];
  try {
    // @ts-ignore
    for (let child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const leadingSpace = /^\s+/.exec(child.nodeValue);
        const trailingSpace = /\s+$/.exec(child.nodeValue);
        if (leadingSpace !== null) {
          tokens.push({
            type: "whitespace",
            textRepresentation: leadingSpace[0],
          });
        }
        const words = child.nodeValue.trim().split(" ");
        words.forEach((word, wordIndex) => {
          tokens.push({
            type: "word",
            textRepresentation: word,
          });
          if (wordIndex !== words.length - 1) {
            tokens.push({
              type: "whitespace",
              textRepresentation: " ",
            });
          }
        });
        if (trailingSpace !== null) {
          tokens.push({
            type: "whitespace",
            textRepresentation: trailingSpace[0],
          });
        }
      } else {
        const startTagMatch = /^<[^>]*>/gm.exec(child.outerHTML);
        const endTagMatch = /<\/[^>]*>$/gm.exec(child.outerHTML);
        tokens.push({
          type: "tag",
          textRepresentation: startTagMatch[0],
        });
        const childTokens = serializeNodeIntoTokens(child);
        tokens.push(...childTokens);
        if (endTagMatch) {
          tokens.push({
            type: "tag",
            textRepresentation: endTagMatch[0],
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
  return tokens;
}

export const project = (
  detaggedString: DetaggedString,
  translatedString: string,
): string => {
  // console.info("project", { detaggedString, translatedString });

  // Return the translated string as is if there were no tokens in the original string
  if (
    detaggedString.tokens.filter(token => token.type === "tag").length === 0
  ) {
    return translatedString;
  }

  // inject the tags naively in the translated string assuming a 1:1
  // relationship between original text nodes and words in the translated string
  const translatedStringWords = translatedString.split(" ");

  let projectedString = "";
  let currentTextTokenOrdinal = 0;
  let remainingTranslatedStringWords = [...translatedStringWords];
  detaggedString.tokens.forEach((token, tokenOrdinal) => {
    if (token.type === "word") {
      const correspondingTranslatedWord = remainingTranslatedStringWords.shift();
      // If we have run out of translated words, don't attempt to add to the projected string
      if (correspondingTranslatedWord !== undefined) {
        // Inject the translated word with the same kind of trailing and leading spaces that the original text had
        projectedString += correspondingTranslatedWord;
      }
      currentTextTokenOrdinal++;
    } else {
      projectedString += token.textRepresentation;
    }
  });
  // Add any remaining translated words to the end
  projectedString += remainingTranslatedStringWords.join(" ");

  // console.debug({translatedStringWords, projectedString});

  return projectedString;
};
