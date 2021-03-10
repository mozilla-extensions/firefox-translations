export interface DetaggedString {
  originalString: string;
  tokens: NodeToken[];
  plainString: string;
}

interface NodeToken {
  type: "word" | "tag" | "whitespace";
  tagName?: string;
  textRepresentation: string;
}

const isTagTokenWithImpliedWhitespace = (token: NodeToken) => {
  return token.type === "tag" && token.tagName === "br";
};

export const detag = (originalString: string): DetaggedString => {
  // console.info("detag", { originalString });

  const originalStringDoc = new DOMParser().parseFromString(
    originalString,
    "text/html",
  );
  // console.debug("originalStringDoc.body", originalStringDoc.body);

  const tokens = serializeNodeIntoTokens(originalStringDoc.body);
  // console.debug({ tokens });

  const plainString = tokens
    .map(token => {
      if (token.type === "tag") {
        return isTagTokenWithImpliedWhitespace(token) ? " " : "";
      }
      return token.textRepresentation;
    })
    .join("");

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
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const textChunk = child.nodeValue.trim();
        // If this is only whitespace, only add such a token and then visit the next node
        if (textChunk === "") {
          tokens.push({
            type: "whitespace",
            textRepresentation: " ",
          });
          continue;
        }
        // Otherwise, parse the text content and add whitespace + word tokens as necessary
        const leadingSpace = /^\s+/.exec(child.nodeValue);
        const trailingSpace = /\s+$/.exec(child.nodeValue);
        if (leadingSpace !== null) {
          tokens.push({
            type: "whitespace",
            textRepresentation: leadingSpace[0],
          });
        }
        const words = textChunk.split(" ");
        words.forEach((word, wordIndex) => {
          // Don't add empty words
          if (word !== "") {
            tokens.push({
              type: "word",
              textRepresentation: word,
            });
          }
          // Add whitespace tokens for spaces in between words, eg not after the last word
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
        const tagName = child.tagName.toLowerCase();
        tokens.push({
          type: "tag",
          tagName,
          textRepresentation: startTagMatch[0],
        });
        const childTokens = serializeNodeIntoTokens(child);
        tokens.push(...childTokens);
        if (endTagMatch) {
          tokens.push({
            type: "tag",
            tagName,
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

  // If the last token is a tag, we pop it off the token array and re-add it
  // last so that the last tag gets any additional translation content injected into it
  const lastToken: NodeToken = detaggedString.tokens.slice(-1)[0];
  if (lastToken.type === "tag") {
    detaggedString.tokens.pop();
  }

  // Inject the tags naively in the translated string assuming a 1:1
  // relationship between original text nodes and words in the translated string
  const translatedStringWords = translatedString.split(" ");
  const remainingTranslatedStringWords = [...translatedStringWords];
  let whitespaceHaveBeenInjectedSinceTheLastWordWasInjected = true;
  const projectedStringParts = detaggedString.tokens.map((token): string => {
    const determineProjectedStringPart = () => {
      if (token.type === "word") {
        const correspondingTranslatedWord = remainingTranslatedStringWords.shift();
        // If we have run out of translated words, don't attempt to add to the projected string
        if (correspondingTranslatedWord === undefined) {
          return "";
        }
        // Otherwise, inject the translated word
        // ... possibly with a space injected in case none has been injected since the last word
        const $projectedStringPart = `${
          whitespaceHaveBeenInjectedSinceTheLastWordWasInjected ? "" : " "
        }${correspondingTranslatedWord}`;
        whitespaceHaveBeenInjectedSinceTheLastWordWasInjected = false;
        return $projectedStringPart;
      } else if (token.type === "whitespace") {
        // Don't pad whitespace onto each other when there are no more words
        if (remainingTranslatedStringWords.length === 0) {
          return "";
        }
        whitespaceHaveBeenInjectedSinceTheLastWordWasInjected = true;
        return token.textRepresentation;
      } else if (token.type === "tag") {
        if (isTagTokenWithImpliedWhitespace(token)) {
          whitespaceHaveBeenInjectedSinceTheLastWordWasInjected = true;
        }
        return token.textRepresentation;
      }
      throw new Error(`Unexpected token type: ${token.type}`);
    };
    const projectedStringPart = determineProjectedStringPart();
    return projectedStringPart;
  });

  let projectedString = projectedStringParts.join("");

  // Add any remaining translated words to the end
  if (remainingTranslatedStringWords.length) {
    // Add a whitespace to the end first in case there was none, or else two words will be joined together
    if (lastToken.type !== "whitespace") {
      projectedString += " ";
    }
    projectedString += remainingTranslatedStringWords.join(" ");
  }

  // If the last token is a tag, see above
  if (lastToken.type === "tag") {
    projectedString += lastToken.textRepresentation;
  }

  // console.debug({translatedStringWords, projectedString});

  return projectedString;
};
