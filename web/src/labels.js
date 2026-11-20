// The dataset's class labels contain two misspellings. They stay as they are
// in the model, because renaming a class would break any saved artefact that
// refers to it, but nothing shows a visitor a word spelled wrong.
const DISPLAY = { Sweedish: "Swedish", Portugeese: "Portuguese" };

export const label = (name) => DISPLAY[name] || name;
