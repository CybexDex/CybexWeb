// var { List } = require("immutable");
import ChainWebSocket from "./ChainWebSocket";
import GrapheneApi from "./GrapheneApi";
import ChainConfig from "./ChainConfig";

let inst;
let autoReconnect = false; // by default don't use reconnecting-websocket
/**
    Configure: configure as follows `Apis.instance("ws://localhost:8090").init_promise`.  This returns a promise, once resolved the connection is ready.

    Import: import { Apis } from "@graphene/chain"

    Short-hand: Apis.db("method", "parm1", 2, 3, ...).  Returns a promise with results.

    Additional usage: Apis.instance().db_api().exec("method", ["method", "parm1", 2, 3, ...]).  Returns a promise with results.
*/

export const ApiInst = {
  statusCb: null,
  setRpcConnectionStatusCallback: function(callback) {
    this.statusCb = callback;
    if (inst) inst.setRpcConnectionStatusCallback(callback);
  },

  /**
        @arg {boolean} auto means automatic reconnect if possible( browser case), default true
    */
  setAutoReconnect: function(auto) {
    autoReconnect = auto;
  },

  /**
        @arg {string} cs is only provided in the first call
        @return {Apis} singleton .. Check Apis.instance().init_promise to know when the connection is established
    */
  // reset: function(
  //   cs = "ws://localhost:8090",
  //   connect,
  //   connectTimeout = 4000,
  //   optionalApis,
  //   closeCb
  // ) {
  //   return this.close().then(() => {
  //     inst = new ApisInstance();
  //     inst.setRpcConnectionStatusCallback(this.statusCb);

  //     if (inst && connect) {
  //       inst.connect(cs, connectTimeout, optionalApis, closeCb);
  //     }

  //     return inst;
  //   });
  // },
  instance: function(
    cs = "ws://localhost:8090",
    connect?,
    connectTimeout = 4000,
    optionalApis?,
    closeCb?
  ) {
    if (!inst) {
      inst = new ApisInstance();
      // inst = new ApisInstance(cs);
      inst.setRpcConnectionStatusCallback(this.statusCb);
    }

    if (inst && connect) {
      inst.connect(cs, connectTimeout, optionalApis);
    }
    if (closeCb) inst.closeCb = closeCb;
    return inst;
  },
  close: () => {
    if (inst) {
      return new Promise(res => {
        inst.close().then(() => {
          inst = null;
          res();
        });
      });
    }

    return Promise.resolve();
  }
  // db: (method, ...args) => Apis.instance().db_api().exec(method, toStrings(args)),
  // network: (method, ...args) => Apis.instance().network_api().exec(method, toStrings(args)),
  // history: (method, ...args) => Apis.instance().history_api().exec(method, toStrings(args)),
  // crypto: (method, ...args) => Apis.instance().crypto_api().exec(method, toStrings(args))
  // orders: (method, ...args) => Apis.instance().orders_api().exec(method, toStrings(args))
};

export default ApiInst;

class ApisInstance {
  url: string = "";
  chain_id: string | undefined;
  ws_rpc: ChainWebSocket | undefined | null;
  _db: GrapheneApi | undefined;
  _net: GrapheneApi | undefined;
  _hist: GrapheneApi | undefined;
  statusCb: CallableFunction | undefined;
  closeCb: CallableFunction | undefined;
  init_promise: Promise<any> | undefined;
  connectTimeout = 3000;

  // constructor(cs: string) {
  //   this.url = cs;
  //   this.ws_rpc = new ChainWebSocket(
  //     cs,
  //     this.statusCb,
  //     60 * 1000,
  //     autoReconnect,
  //     closed => {
  //       if (this._db && !closed) {
  //         this._db.exec("get_objects", [["2.1.0"]]).catch(e => {});
  //       }
  //     }
  //   );
  //   this._db = new GrapheneApi(this.ws_rpc, "database");
  //   this._net = new GrapheneApi(this.ws_rpc, "network_broadcast");
  //   this._hist = new GrapheneApi(this.ws_rpc, "history");
  // }
  /** @arg {string} connection .. */
  connect(
    cs,
    connectTimeout,
    optionalApis = { enableCrypto: false, enableOrders: false }
  ) {
    // console.log("INFO\tApiInstances\tconnect\t", cs);
    this.url = cs;
    this.connectTimeout = connectTimeout;
    let rpc_user = "",
      rpc_password = "";
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.protocol === "https:" &&
      cs.indexOf("wss://") < 0
    ) {
      throw new Error("Secure domains require wss connection");
    }

    if (this.ws_rpc) {
      this.ws_rpc.statusCb = null;
      this.ws_rpc.keepAliveCb = null;
      this.ws_rpc.on_close = null;
      this.ws_rpc.on_reconnect = null;
    }
    this.ws_rpc = new ChainWebSocket(
      cs,
      this.statusCb,
      connectTimeout,
      autoReconnect,
      closed => {
        if (this._db && !closed) {
          this._db.exec("get_objects", [["2.1.0"]]).catch(e => {});
        }
      }
    );

    console.debug("[Timing] Init RPC");
    this.init_promise = this.ws_rpc
      .login(rpc_user, rpc_password)
      .then(() => {
        console.log("Connected to API node:", cs);
        this._db = new GrapheneApi(this.ws_rpc, "database");
        this._net = new GrapheneApi(this.ws_rpc, "network_broadcast");
        this._hist = new GrapheneApi(this.ws_rpc, "history");
        // if (optionalApis.enableOrders)
        //   this._orders = new GrapheneApi(this.ws_rpc, "orders");
        // if (optionalApis.enableCrypto)
        //   this._crypt = new GrapheneApi(this.ws_rpc, "crypto");
        var db_promise = this._db.init().then(() => {
          //https://github.com/cryptonomex/graphene/wiki/chain-locked-tx
          return this._db.exec("get_chain_id", []).then(_chain_id => {
            this.chain_id = _chain_id;
            return ChainConfig.setChainId(_chain_id);
            //DEBUG console.log("chain_id1",this.chain_id)
          });
        });
        if (!this.ws_rpc) {
          throw new Error("No Wsrpc client");
        }
        this.ws_rpc.on_reconnect = () => {
          if (!this.ws_rpc) return;
          this.ws_rpc.login("", "").then(() => {
            this._db.init().then(() => {
              if (this.statusCb) this.statusCb("reconnect");
            });
            this._net.init();
            this._hist.init();
            // if (optionalApis.enableOrders) this._orders.init();
            // if (optionalApis.enableCrypto) this._crypt.init();
          });
        };
        this.ws_rpc.on_close = () => {
          (this.close as any)().then(() => {
            if (this.closeCb) this.closeCb();
          });
        };
        let initPromises = [db_promise, this._net.init(), this._hist.init()];

        // if (optionalApis.enableOrders) initPromises.push(this._orders.init());
        // if (optionalApis.enableCrypto) initPromises.push(this._crypt.init());
        return Promise.all(initPromises);
      })
      .then(res => {
        initPromise = null;
        return res;
      })
      .catch(err => {
        console.error(
          cs,
          "Failed to initialize with error",
          err && err.message
        );
        return (this.close as any)().then(() => {
          throw err;
        });
      });
  }

  close() {
    if (!this.ws_rpc || !this.ws_rpc.ws) {
      return;
    }
    if (this.ws_rpc && this.ws_rpc.ws.readyState === 1) {
      return this.ws_rpc.close().then(() => {
        this.ws_rpc = null;
      });
    }
    this.ws_rpc = null;
    return Promise.resolve();
  }
  get wsReady() {
    // console.debug(
    //   "Check WsReady: ",
    //   this.ws_rpc,
    //   this.ws_rpc && this.ws_rpc.ws,
    //   this.ws_rpc && this.ws_rpc.ws && this.ws_rpc.ws.readyState === 1,
    //   this._db,
    //   this._db && this._db.exec
    // );
    return !!(
      this.ws_rpc &&
      this.ws_rpc.ws &&
      this.ws_rpc.ws.readyState === 1 &&
      this._db &&
      this._db.exec
    );
  }
  db_api() {
    return (this.wsReady && this._db) || new DeferedApi(ApiType.Database, this);
  }

  network_api() {
    return (this.wsReady && this._net) || new DeferedApi(ApiType.Network, this);
  }

  history_api() {
    return (
      (this.wsReady && this._hist) || new DeferedApi(ApiType.History, this)
    );
  }

  // crypto_api() {
  //   return this._crypt;
  // }

  // orders_api() {
  //   return this._orders;
  // }

  setRpcConnectionStatusCallback(callback) {
    this.statusCb = callback;
  }
}
enum ApiType {
  Database = "database",
  Network = "network_broadcast",
  History = "history"
}

let initPromise: null | Promise<any> = null;

class DeferedApi {
  constructor(public apiType: ApiType, public apiInstance: ApisInstance) {}
  exec(...args) {
    return new Promise(async (resolve, reject) => {
      let _this = this;
      let count = 0;
      (async function impl() {
        if (!ApiInst.instance().wsReady && !_this.apiInstance.wsReady) {
          if (!initPromise) {
            initPromise = ApiInst.instance(
              ApiInst.instance().url,
              true,
              ApiInst.instance().connectTimeout
            ).init_promise.catch(err => {
              initPromise = null;
            });
          }
        }
        await initPromise;
        let instance = ApiInst.instance().wsReady
          ? ApiInst.instance()
          : _this.apiInstance;
        if (instance.wsReady) {
          switch (_this.apiType) {
            case ApiType.Database:
              return instance
                .db_api()
                .exec(...args)
                .then(resolve);
            case ApiType.Network:
              return instance
                .network_api()
                .exec(...args)
                .then(resolve);
            case ApiType.History:
              return instance
                .history_api()
                .exec(...args)
                .then(resolve);
          }
        } else if (count++ < 5) {
          setTimeout(impl, 750);
        } else {
          reject();
        }
      })();
    });
  }
}
