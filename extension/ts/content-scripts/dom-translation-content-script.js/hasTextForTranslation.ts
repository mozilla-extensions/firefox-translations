export const hasTextForTranslation = text => {
  const trimmed = text.trim();
  if (trimmed === "") {
    return false;
  }
  return /\p{L}/gu.test(trimmed);
};
