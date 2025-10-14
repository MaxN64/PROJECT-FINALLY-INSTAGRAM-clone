let accessToken = "";

function normalize(token) {
  return typeof token === "string" ? token : token ? String(token) : "";
}

export function setAccessToken(token) {
  accessToken = normalize(token);
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = "";
}
