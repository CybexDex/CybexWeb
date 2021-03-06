import alt from "alt-instance";
import SettingsActions from "actions/SettingsActions";
import IntlActions from "actions/IntlActions";
import { Map, List } from "immutable";
import { merge } from "lodash";
import ls from "common/localStorage";
import { Apis } from "cybexjs-ws";
import { settingsAPIs } from "api/apiConfig";
import { AbstractStore } from "./AbstractStore";
import { FetchChain } from "cybexjs";

export const preferredBases = List([
  "JADE.USDT",
  "JADE.ETH",
  "JADE.BTC",
  "CYB"
]);
export const MARKETS = [
  // Main Net
  "CYB",
  "JADE.MT",
  "JADE.ETH",
  "JADE.BTC",
  "JADE.EOS",
  "JADE.LC",
  "JADE.LTC",
  "JADE.LHT",
  "JADE.INK",
  "JADE.BAT",
  "JADE.OMG",
  "JADE.SNT",
  "JADE.NAS",
  "JADE.KNC",
  "JADE.PAY",
  "JADE.GET",
  "JADE.MAD",
  "JADE.GNX",
  "JADE.KEY",
  "JADE.TCT",
  "JADE.POS",
  "JADE.ATOM",
  "JADE.IRIS",
  "JADE.RING",
  "JADE.XRP",
  "JADE.QLC",
  "JADE.MXC",
  "JADE.CENNZ",
  "JADE.NASH",
  "JADE.NWT",
  "JADE.POLY",
  "JADE.JCT",
  "JADE.MCO",
  // "JADE.HER",
  "JADE.CTXC",
  "JADE.VET",
  "JADE.NES",
  "JADE.RHOC",
  "JADE.PPT",
  "JADE.MKR",
  "JADE.FUN",
  // "JADE.SDT",
  "JADE.MVP",
  // "JADE.ICX",
  // "JADE.BTM",
  "JADE.GNT",
  // "JADE.NKN",
  "JADE.MVP",
  "JADE.USDT",
  "JADE.DPY"
  // "JADE.LST",
  // "JADE.ENG"
];

const CORE_ASSET = "CYB"; // Setting this to CYB to prevent loading issues when used with CYB chain which is the most usual case currently

const STORAGE_KEY = "__graphene__";
let ss = new ls(STORAGE_KEY);
const SETTING_VERSION = "defaults_v2";

class SettingsStore extends AbstractStore<any> {
  initDone = false;
  defaultSettings = Map();
  settings;
  defaults;
  viewSettings;
  marketDirections;
  hiddenAssets;
  apiLatencies;
  mainnet_faucet;
  testnet_faucet;
  starredKey;
  marketsKey;
  preferredBases;
  allDefaultMarkets;
  defaultMarkets;
  starredMarkets;
  userMarkets;
  fp;

  constructor() {
    super();
    this.exportPublicMethods({
      init: this.init.bind(this),
      getSetting: this.getSetting.bind(this),
      getLastBudgetObject: this.getLastBudgetObject.bind(this),
      setLastBudgetObject: this.setLastBudgetObject.bind(this)
    });

    this.bindListeners({
      onChangeSetting: SettingsActions.changeSetting,
      onChangeViewSetting: SettingsActions.changeViewSetting,
      onChangeMarketDirection: SettingsActions.changeMarketDirection,
      onAddStarMarket: SettingsActions.addStarMarket,
      onRemoveStarMarket: SettingsActions.removeStarMarket,
      onClearStarredMarkets: SettingsActions.clearStarredMarkets,
      onAddWS: SettingsActions.addWS,
      onRemoveWS: SettingsActions.removeWS,
      onHideAsset: SettingsActions.hideAsset,
      onClearSettings: SettingsActions.clearSettings,
      onSwitchLocale: IntlActions.switchLocale,
      onSetUserMarket: SettingsActions.setUserMarket,
      // onSetGuideMode: SettingsActions.setGuideMode,
      onUpdateLatencies: SettingsActions.updateLatencies,
      onToggleNav: SettingsActions.toggleNav
    });

    this.initDone = false;
    this.defaultSettings = Map({
      locale: "zh",
      apiServer: settingsAPIs.DEFAULT_WS_NODE,
      faucet_address: settingsAPIs.DEFAULT_FAUCET,
      unit: CORE_ASSET,
      showSettles: false,
      showAssetPercent: false,
      walletLockTimeout: 60 * 10,
      themes: "cybexDarkTheme",
      disableChat: false,
      advancedMode: false,
      navState: true,
      passwordLogin: true
    });

    // If you want a default value to be translated, add the translation to settings in locale-xx.js
    // and use an object {translate: key} in the defaults array
    let apiServer = settingsAPIs.WS_NODE_LIST;

    let defaults = {
      locale: [
        "zh",
        "en"
        // , "vn"
      ],
      apiServer: [],
      unit: [CORE_ASSET, "JADE.ETH", "JADE.USDT", "BTC"],
      showSettles: [{ translate: "yes" }, { translate: "no" }],
      showAssetPercent: [{ translate: "yes" }, { translate: "no" }],
      advancedMode: [{ translate: "yes" }, { translate: "no" }],
      themes: ["cybexDarkTheme"],
      passwordLogin: [
        { translate: "cloud_login" },
        { translate: "local_wallet" }
      ]
      // confirmMarketOrder: [
      //     {translate: "confirm_yes"},
      //     {translate: "confirm_no"}
      // ]
    };

    // this.settings = Immutable.Map(merge(this.defaultSettings.toJS(), ss.get("settings_v3")));

    // TODO for Online
    this.settings = Map(
      merge(this.defaultSettings.toJS(), ss.get("settings_v3"))
    );

    let savedDefaults = ss.get(SETTING_VERSION, {});
    /* Fix for old clients after changing cn to zh */
    if (savedDefaults && savedDefaults.locale) {
      let cnIdx = savedDefaults.locale.findIndex(a => a === "cn");
      if (cnIdx !== -1) savedDefaults.locale[cnIdx] = "zh";
    }
    this.defaults = merge({}, defaults, savedDefaults);

    (savedDefaults.apiServer || []).forEach(api => {
      let hasApi = false;
      if (typeof api === "string") {
        api = { url: api, location: null };
      }
      this.defaults.apiServer.forEach(server => {
        if (server.url === api.url) {
          hasApi = true;
        }
      });

      if (!hasApi) {
        this.defaults.apiServer.push(api);
      }
    });

    if (
      !savedDefaults ||
      (savedDefaults &&
        (!savedDefaults.apiServer || !savedDefaults.apiServer.length))
    ) {
      for (let i = apiServer.length - 1; i >= 0; i--) {
        let hasApi = false;
        this.defaults.apiServer.forEach(api => {
          if (api.url === apiServer[i].url) {
            hasApi = true;
          }
        });
        if (!hasApi) {
          this.defaults.apiServer.unshift(apiServer[i]);
        }
      }
    }

    this.viewSettings = Map(ss.get("viewSettings_v1"));

    this.marketDirections = Map(ss.get("marketDirections"));

    this.hiddenAssets = List(ss.get("hiddenAssets", []));

    this.apiLatencies = ss.get("apiLatencies", {});

    this.mainnet_faucet = ss.get("mainnet_faucet", settingsAPIs.DEFAULT_FAUCET);
    this.testnet_faucet = ss.get("testnet_faucet", settingsAPIs.TESTNET_FAUCET);
  }

  init() {
    return new Promise(async resolve => {
      if (this.initDone) resolve();
      this.starredKey = this._getChainKey("markets");
      this.marketsKey = this._getChainKey("userMarkets");
      this.fp = Math.floor(Math.random() * 100) + Date.now();
      let allDefaultMarkets = new Set();
      const DefaultM = {
        "1.3.0": {
          code: 0,
          data: [
            "1.3.28",
            "1.3.5",
            "1.3.4",
            "1.3.6",
            "1.3.11",
            "1.3.9",
            "1.3.23",
            "1.3.24",
            "1.3.21",
            "1.3.506",
            "1.3.999",
            "1.3.1001",
            "1.3.998"
          ]
        },
        "1.3.2": {
          code: 0,
          data: [
            "1.3.0",
            "1.3.302",
            "1.3.19",
            "1.3.4",
            "1.3.24",
            "1.3.499",
            "1.3.23",
            "1.3.21",
            "1.3.430",
            "1.3.481",
            "1.3.482",
            "1.3.502",
            "1.3.506",
            "1.3.654",
            "1.3.8",
            "1.3.996",
            "1.3.997",
            "1.3.501",
            "1.3.999",
            "1.3.998",
            "1.3.1001",
            "1.3.1382",
            "1.3.1383",
            "1.3.1386"
          ]
        },
        "1.3.3": { code: 0, data: ["1.3.26", "1.3.1000", "1.3.1391"] },
        "1.3.27": {
          code: 0,
          data: [
            "1.3.0",
            "1.3.2",
            "1.3.3",
            "1.3.4",
            "1.3.26",
            "1.3.999",
            "1.3.1000",
            "1.3.1001",
            "1.3.1002",
            "1.3.1386",
            "1.3.1382",
            "1.3.1385",
            "1.3.1391",
            "1.3.1392",
            "1.3.1393"
          ]
        }
      };
      let defaultMarkets = await Promise.all(
        [
          // Main Net
          "1.3.0",
          "1.3.2",
          "1.3.3",
          "1.3.27"
        ].map(baseId =>
          Promise.resolve(DefaultM[baseId])
            .then(res => res.data)
            .then((quoteIds: string[]) =>
              Promise.all([
                FetchChain("getAsset", baseId),
                ...quoteIds.map(quoteId => FetchChain("getAsset", quoteId))
              ])
            )
            .then(([baseAsset, ...quoteAssets]) =>
              quoteAssets.map(marketAsset => {
                try {
                  allDefaultMarkets.add(marketAsset.get("symbol"));
                  allDefaultMarkets.add(baseAsset.get("symbol"));
                  return [
                    `${marketAsset.get("symbol")}_${baseAsset.get("symbol")}`,
                    {
                      quote: marketAsset.get("symbol"),
                      base: baseAsset.get("symbol")
                    }
                  ];
                } catch (err) {
                  console.error(err);
                }
              })
            )
        )
      ).then(groupedMarkets =>
        groupedMarkets.reduce((prev, next) => prev.concat(next))
      );
      let coreAsset = "CYB";
      this.defaults.unit[0] = coreAsset;

      this.allDefaultMarkets = allDefaultMarkets;
      this.preferredBases = List(["CYB", "JADE.BTC", "JADE.ETH", "JADE.USDT"]);

      this.defaultMarkets = Map(defaultMarkets);
      this.starredMarkets = Map(ss.get(this.starredKey, []));
      this.userMarkets = Map(ss.get(this.marketsKey, {}));

      this.initDone = true;
      resolve();
    });
  }

  getSetting(setting) {
    return this.settings.get(setting);
  }

  onChangeSetting(payload) {
    this.settings = this.settings.set(payload.setting, payload.value);

    switch (payload.setting) {
      case "faucet_address":
        if (payload.value.indexOf("testnet") === -1) {
          this.mainnet_faucet = payload.value;
          ss.set("mainnet_faucet", payload.value);
        } else {
          this.testnet_faucet = payload.value;
          ss.set("testnet_faucet", payload.value);
        }
        break;

      case "apiServer":
        let faucetUrl =
          payload.value.indexOf("testnet") !== -1
            ? this.testnet_faucet
            : this.mainnet_faucet;
        this.settings = this.settings.set("faucet_address", faucetUrl);
        break;

      case "walletLockTimeout":
        ss.set("lockTimeout", payload.value);
        break;

      default:
        break;
    }

    ss.set("settings_v3", this.settings.toJS());
  }

  onChangeViewSetting(payload) {
    for (let key in payload) {
      this.viewSettings = this.viewSettings.set(key, payload[key]);
    }

    ss.set("viewSettings_v1", this.viewSettings.toJS());
  }

  onChangeMarketDirection(payload) {
    for (let key in payload) {
      this.marketDirections = this.marketDirections.set(key, payload[key]);
    }
    ss.set("marketDirections", this.marketDirections.toJS());
  }

  onHideAsset(payload) {
    if (payload.id) {
      if (!payload.status) {
        this.hiddenAssets = this.hiddenAssets.delete(
          this.hiddenAssets.indexOf(payload.id)
        );
      } else {
        this.hiddenAssets = this.hiddenAssets.push(payload.id);
      }
    }

    ss.set("hiddenAssets", this.hiddenAssets.toJS());
  }

  onAddStarMarket(market) {
    let marketID = market.quote + "_" + market.base;
    if (!this.starredMarkets.has(marketID)) {
      this.starredMarkets = this.starredMarkets.set(marketID, {
        quote: market.quote,
        base: market.base
      });

      ss.set(this.starredKey, this.starredMarkets.toJS());
    } else {
      return false;
    }
  }

  onSetUserMarket(payload) {
    let marketID = payload.quote + "_" + payload.base;
    if (payload.value) {
      this.userMarkets = this.userMarkets.set(marketID, {
        quote: payload.quote,
        base: payload.base
      });
    } else {
      this.userMarkets = this.userMarkets.delete(marketID);
    }
    ss.set(this.marketsKey, this.userMarkets.toJS());
  }

  onRemoveStarMarket(market) {
    let marketID = market.quote + "_" + market.base;

    this.starredMarkets = this.starredMarkets.delete(marketID);

    ss.set(this.starredKey, this.starredMarkets.toJS());
  }

  onClearStarredMarkets() {
    this.starredMarkets = Map({});
    ss.set(this.starredKey, this.starredMarkets.toJS());
  }

  onAddWS(ws) {
    if (typeof ws === "string") {
      ws = { url: ws, location: null };
    }
    this.defaults.apiServer.push(ws);
    ss.set(SETTING_VERSION, this.defaults);
  }

  onRemoveWS(index) {
    if (index !== 0) {
      // Prevent removing the default apiServer
      this.defaults.apiServer.splice(index, 1);
      ss.set(SETTING_VERSION, this.defaults);
    }
  }

  onClearSettings(resolve) {
    ss.remove("settings_v3");
    this.settings = this.defaultSettings;

    ss.set("settings_v3", this.settings.toJS());

    if (resolve) {
      resolve();
    }
  }

  onSwitchLocale({ locale }) {
    this.onChangeSetting({ setting: "locale", value: locale });
  }

  onSetGuideMode(isEnabled) {
    this.settings.set("guideMode", !!isEnabled);
  }

  onToggleNav(targetState) {
    this.onChangeSetting({
      setting: "navState",
      value: !this.settings.get("navState")
    });
  }

  _getChainKey(key) {
    const chainId = Apis.instance().chain_id;
    return key + (chainId ? `_${chainId.substr(0, 8)}` : "");
  }

  onUpdateLatencies(latencies) {
    ss.set("apiLatencies", latencies);
    this.apiLatencies = latencies;
  }

  getLastBudgetObject() {
    return ss.get(this._getChainKey("lastBudgetObject"), "2.13.1");
  }

  setLastBudgetObject(value) {
    ss.set(this._getChainKey("lastBudgetObject"), value);
  }
}

export default alt.createStore(SettingsStore, "SettingsStore") as SettingsStore;
