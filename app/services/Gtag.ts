import { debugGen } from "utils";
const $w = window as typeof window & { gtag };
const debug = debugGen("Gtag");

const EVENT_CATE = {
  ACCOUNT: "ACCOUNT",
  ACTIVITY: "ACTIVITY",
  TRANSACTION: "TRANSACTION"
};


/**
 * 主动触发谷歌分析工具特定方法
 *
 * @export
 * @class Gtag
 */
export class Gtag {
  static eventRegisterDone(accountName: string, method: string) {
    Gtag.reportEvent(
      `REGISTER_DONE:${method}`,
      EVENT_CATE.ACCOUNT,
      accountName
    );
  }
  static eventLoginDone(accountName: string, method: string) {
    Gtag.reportEvent(
      `LOGIN_DONE:${method}`,
      EVENT_CATE.ACCOUNT,
      accountName
    );
  }

  static eventActivity(name: string, subContent: string) {
    Gtag.reportEvent(
      `${EVENT_CATE.ACTIVITY}:${name}`,
      EVENT_CATE.ACTIVITY,
      subContent
    );
  }

  static reportEvent(
    eventName: string,
    category: string,
    label: string,
    value = 1
  ) {
    debug("[Event]", eventName, label);
    if ("gtag" in $w) {
      $w.gtag("event", eventName.toUpperCase(), {
        event_category: category.toUpperCase(),
        event_label: label,
        value
      });
    }
  }

  static eventUnlock(accountName: string, method: string) {
    Gtag.reportEvent(`UNLOCK:${method}`, EVENT_CATE.ACCOUNT, accountName);
  }

  static eventTracactionBroadcast(accountName: string, operation: string) {
    Gtag.reportEvent(
      `BROADCAST:${operation}`,
      EVENT_CATE.TRANSACTION,
      accountName
    );
  }

  static eventTracactionBroadcastFailed(
    accountName: string,
    operation: string
  ) {
    Gtag.reportEvent(
      `BROADCAST_FAILED:${operation}`,
      EVENT_CATE.TRANSACTION,
      accountName
    );
  }

  static eventRegisterFailed(accountName: string) {
    Gtag.reportEvent("REGISTER_FAILED", EVENT_CATE.ACCOUNT, accountName);
  }
}

export default Gtag;
