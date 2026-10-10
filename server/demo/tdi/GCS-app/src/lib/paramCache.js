let PARAM_CACHE = null;

export function getParamCache() {
  return PARAM_CACHE;
}

export function setParamCache(data) {
  PARAM_CACHE = data;
}

export function updateParamCache(partial) {
  PARAM_CACHE = {
    ...PARAM_CACHE,
    ...partial,
  };
}
