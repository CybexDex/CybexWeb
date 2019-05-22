import { Serializer, types } from "cybexjs";

const { static_variant, string, time_point_sec, array, bool, optional } = types;

export namespace Eto {
  export enum Fields {
    basic = "basic",
    accountName = "accountName",
    accountID = "accountID",
    token = "token",
    survey = "survey",
    records = "records"
  }
  export enum Token {
    CYB = "CYB",
    USDT = "JADE.USDT"
  }
  export enum EtoPersonalState {
    Uninit,
    Basic,
    Survey,
    Lock,
    ApplyDone
  }
  export type Info = {
    email: string;
    wechat: string;
    refer: string;
  };
  export type Survey = any[];
  export type Records = any[];
  export type FullInfo = {
    [Fields.basic]: Info;
    [Fields.accountID]: string;
    [Fields.accountName]: string;
    [Fields.token]: Token;
    [Fields.survey]: Survey;
    [Fields.records]: Records;
  };
  export type Query = "query";
  export type Ops = Query | Info | Survey | Token;
  export enum OpsOrder {
    Query = 0,
    Info,
    Survey,
    Token
  }
  export interface Request<T = Ops> {
    op: [number, T];
    expiration: number;
  }
  export interface RequestWithSigner<T = Ops> {
    op: [number, T];
    expiration: number;
    signer: string;
  }

  export class EtoInfo {
    state: EtoPersonalState = EtoPersonalState.Basic;
    sum = 0;
    info: FullInfo | null = null;
    constructor(info?: FullInfo) {
      if (info) {
        this.info = info;
        if (info[Fields.basic]) {
          this.state = EtoPersonalState.Survey;
        }
        if (info[Fields.survey]) {
          this.state = EtoPersonalState.Lock;
        }
        this.sum = (info.records || []).reduce(
          (sum, next) => sum + next.value,
          0
        );
      }
    }
  }
}

const etoOps = {
  Query: string,
  Token: string,
  Survey: array(bool),
  Info: new Serializer("Info", {
    email: string,
    wechat: optional(string),
    refer: optional(string)
  })
};

const etoOp = static_variant([
  etoOps.Query,
  etoOps.Info,
  etoOps.Survey,
  etoOps.Token
]);
export const etoTx = new Serializer("EtoTx", {
  op: etoOp,
  expiration: time_point_sec
});
export const EtoRefer = "$#ETO_REFER";
