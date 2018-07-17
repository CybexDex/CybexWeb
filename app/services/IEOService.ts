export const API_URL = __DEV__
  ? "http://106.14.159.224:3049/api/cybex/"
  : __TEST__
    ? "https://ieo-apitest.nbltrust.com/api/cybex/"
    : "https://ieo.cybex.io/api/cybex/";

export const PERSONAL_TRADE = `${API_URL}trade/list?cybex_name=alec-2216&page=1&limit=1`
export const getTradeUrl = account => `${API_URL}trade/list?cybex_name=${account}&page=1&limit=1000`

export const getProjects = () => {};
