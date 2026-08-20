export function isValidProjectName(name) {
  return /^[a-zA-Z0-9-_]+$/.test(name) && name.trim().length > 0;
}
