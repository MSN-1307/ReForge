export function copyText(text) {
  navigator.clipboard.writeText(text);
}

export function clearText(setter) {
  setter("");
}