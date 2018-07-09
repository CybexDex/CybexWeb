import * as React from "react";
import * as PropTypes from "prop-types";
import FormattedAsset from "../Utility/FormattedAsset";
import { Link } from "react-router";
import classNames from "classnames";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import utils from "common/utils";
import BlockTime from "./BlockTime";
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import { ChainStore, ChainTypes as grapheneChainTypes } from "cybexjs";
import account_constants from "chain/account_constants";
import MemoText from "./MemoText";
import ProposedOperation from "./ProposedOperation";
import marketUtils from "common/market_utils";
import { connect } from "alt-react";
import SettingsStore from "stores/SettingsStore";
import * as humanize from "humanize-duration";
import IntlStore from "stores/IntlStore";

import { pickContent } from "lib/qtb";

const { operations } = grapheneChainTypes;
require("./operations.scss");

let ops = Object.keys(operations);
let listings = account_constants.account_listing;

function getVestingPeriodFromOp(op) {
  if (!op.extensions || !op.extensions.length|| !op.extensions[0][1]) return null;
  return op.extensions[0][1]["vesting_period"];
}
const SECONDS_OF_ONE_DAY = 86400000;

class TransactionLabel extends React.PureComponent<any, any> {
  // shouldComponentUpdate(nextProps) {
  //     return (
  //         nextProps.color !== this.props.color ||
  //         nextProps.type !== this.props.type
  //     );
  // }
  render() {
    let trxTypes = counterpart.translate("transaction.trxTypes");
    let labelClass = classNames("label", this.props.color || "info");
    return <span className={labelClass}>{trxTypes[ops[this.props.type]]}</span>;
  }
}

let Row = class extends React.PureComponent<any, any> {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  static propTypes = {
    dynGlobalObject: ChainTypes.ChainObject.isRequired
  };

  static defaultProps = {
    dynGlobalObject: "2.1.0",
    tempComponent: "tr"
  };

  constructor(props) {
    super(props);
    // this.showDetails = this.showDetails.bind(this);
  }
  //
  // showDetails(e) {
  //     e.preventDefault();
  //     this.context.router.push(`/block/${this.props.block}`);
  // }

  // 原有检测更新代码没有考虑i18n情况，会导致i18n更新后翻译未更新
  // shouldComponentUpdate(nextProps) {
  //     let { block, dynGlobalObject } = this.props;
  //     let last_irreversible_block_num = dynGlobalObject.get("last_irreversible_block_num");
  //     if (nextProps.dynGlobalObject === this.props.dynGlobalObject) {
  //         return false;
  //     }
  //     // console.debug("[Opeartion/Row]shouldComponentUpdate", this.props ,block > last_irreversible_block_num)
  //     return block > last_irreversible_block_num;
  // }

  render() {
    let { block, fee, color, type, hideOpLabel } = this.props;
    // 待定区块数量
    let last_irreversible_block_num = this.props.dynGlobalObject.get(
      "last_irreversible_block_num"
    );
    let pending = null;
    if (block > last_irreversible_block_num) {
      pending = (
        <span>
          (<Translate
            content="operation.pending"
            blocks={block - last_irreversible_block_num}
          />)
        </span>
      );
    }

    fee.amount = parseInt(fee.amount, 10);

    return (
      <tr>
        {hideOpLabel ? null : (
          <td
            style={{ textAlign: "left" }}
            className="left-td column-hide-tiny"
          >
            <Link
              className="inline-block"
              data-place="bottom"
              data-tip={counterpart.translate("tooltip.show_block", {
                block: utils.format_number(this.props.block, 0)
              })}
              to={`/block/${this.props.block}`}
            >
              <TransactionLabel color={color} type={type} />
            </Link>
          </td>
        )}
        <td style={{ padding: "8px 5px", textAlign: "left" }}>
          <div>
            <span>{this.props.info}</span>
          </div>
          <div style={{ fontSize: 14, paddingTop: 5 }}>
            {/*<span>{counterpart.translate("explorer.block.title").toLowerCase()} <Link to={`/block/${block}`}>{utils.format_number(block, 0)}</Link></span>*/}
            {!this.props.hideFee ? (
              <span className="facolor-fee">
                {" "}
                - <FormattedAsset amount={fee.amount} asset={fee.asset_id} />
              </span>
            ) : null}
            {pending ? <span> - {pending}</span> : null}
          </div>
        </td>
        <td>
          {!this.props.hideDate ? <BlockTime block_number={block} /> : null}
        </td>
      </tr>
    );
  }
};
Row = BindToChainState(Row, { keep_updating: false });

class Operation extends React.PureComponent<any, any> {
  static defaultProps = {
    op: [],
    current: "",
    block: null,
    hideOpLabel: false,
    csvExportMode: false
  };

  static propTypes = {
    op: PropTypes.array.isRequired,
    current: PropTypes.string,
    block: PropTypes.number,
    csvExportMode: PropTypes.bool
  };

  // componentWillReceiveProps(np) {
  //     if (np.marketDirections !== this.props.marketDirections) {
  //         this.forceUpdate();
  //     }
  // }

  linkToAccount(name_or_id) {
    if (!name_or_id) return <span>-</span>;
    return utils.is_object_id(name_or_id) ? (
      <LinkToAccountById account={name_or_id} />
    ) : (
      <Link to={`/account/${name_or_id}/overview`}>{name_or_id}</Link>
    );
  }

  linkToAsset(symbol_or_id) {
    if (!symbol_or_id) return <span>-</span>;
    return utils.is_object_id(symbol_or_id) ? (
      <LinkToAssetById asset={symbol_or_id} />
    ) : (
      <Link to={`/asset/${symbol_or_id}`}>{symbol_or_id}</Link>
    );
  }

  // shouldComponentUpdate(nextProps) {
  //     // Todos 翻译bug
  //     // console.debug("[Operation]shouldComponentUpdate")
  //     // return true;
  //     if (!this.props.op || !nextProps.op) {
  //         return false;
  //     }
  //     return !utils.are_equal_shallow(nextProps.op[1], this.props.op[1]) ||
  //         nextProps.marketDirections !== this.props.marketDirections;
  // }

  render() {
    let { op, current, block } = this.props;
    let line = null,
      column = null,
      color = "info";
    let memoComponent = null;
    switch (
      ops[op[0]] // For a list of trx types, see chain_types.coffee
    ) {
      case "transfer":
        if (op[1].memo) {
          memoComponent = <MemoText memo={op[1].memo} fullLength={true} />;
        }
        if (op[1].memo) {
          memoComponent = <MemoText memo={op[1].memo} />;
        }
        let humanizeLocals = {
          zh: "zh_CN",
          en: "en"
        };
        let locale = IntlStore.getState().currentLocale;
        let vesting = getVestingPeriodFromOp(op[1]);
        let vestingStr = vesting === null
          ? "none"
          : humanize(vesting * 1000, {
              language: humanizeLocals[locale],
              unitMeasures: {
                y: 365 * SECONDS_OF_ONE_DAY,
                mo: 30 * SECONDS_OF_ONE_DAY,
                w: 7 * SECONDS_OF_ONE_DAY,
                d: SECONDS_OF_ONE_DAY,
                h: 3600000,
                m: 60000,
                s: 1000,
              }
            });

        color = "success";
        op[1].amount.amount = parseFloat(op[1].amount.amount);

        column = (
          <span className="right-td">
            <TranslateWithLinks
              string="operation.transfer"
              keys={[
                { type: "account", value: op[1].from, arg: "from" },
                { type: "amount", value: op[1].amount, arg: "amount" },
                { type: "account", value: op[1].to, arg: "to" },
                { value: vestingStr, arg: "vesting" }
              ]}
            />
            {memoComponent}
          </span>
        );

        break;

      case "limit_order_create":
        color = "warning";
        let o = op[1];

        column = (
          <span>
            <BindToChainState.Wrapper
              base={o.min_to_receive.asset_id}
              quote={o.amount_to_sell.asset_id}
            >
              {({ base, quote }) => {
                const { marketID, first, second } = marketUtils.getMarketID(
                  base,
                  quote
                );
                const isBid = o.min_to_receive.asset_id === first.get("id");

                let priceBase = isBid ? o.amount_to_sell : o.min_to_receive;
                let priceQuote = isBid ? o.min_to_receive : o.amount_to_sell;
                const [amount_to_sell, amount_to_buy] = [
                  op[1].amount_to_sell,
                  op[1].min_to_receive
                ];
                let content = pickContent(
                  base.get("symbol"),
                  "limit_order_create",
                  isBid
                    ? "operation.limit_order_buy"
                    : "operation.limit_order_sell"
                );
                return (
                  <TranslateWithLinks
                    string={content}
                    keys={[
                      { type: "account", value: op[1].seller, arg: "account" },
                      {
                        type: "amount",
                        value: amount_to_sell,
                        arg: "amount_to_sell"
                      },
                      {
                        type: "amount",
                        value: amount_to_buy,
                        arg: "amount_to_buy"
                      },
                      {
                        type: "asset",
                        value: amount_to_sell,
                        arg: "asset_to_sell"
                      },
                      {
                        type: "asset",
                        value: amount_to_buy,
                        arg: "asset_to_buy"
                      },
                      {
                        type: "price",
                        value: { base: priceBase, quote: priceQuote },
                        arg: "price"
                      }
                    ]}
                  />
                );
              }}
            </BindToChainState.Wrapper>
          </span>
        );
        break;

      case "limit_order_cancel":
        color = "cancel";
        column = (
          <span>
            <TranslateWithLinks
              string="operation.limit_order_cancel"
              keys={[
                {
                  type: "account",
                  value: op[1].fee_paying_account,
                  arg: "account"
                }
              ]}
              params={{
                order: op[1].order.substring(4)
              }}
            />
          </span>
        );
        break;

      case "call_order_update":
        color = "warning";

        column = (
          <span>
            <BindToChainState.Wrapper base={op[1].delta_debt.asset_id}>
              {({ base }) => {
                let content = pickContent(
                  base.get("symbol"),
                  "call_order_update",
                  "operation.call_order_update"
                );
                return (
                  <TranslateWithLinks
                    string={content}
                    keys={[
                      {
                        type: "account",
                        value: op[1].funding_account,
                        arg: "account"
                      },
                      {
                        type: "asset",
                        value: op[1].delta_debt.asset_id,
                        arg: "debtSymbol"
                      },
                      { type: "amount", value: op[1].delta_debt, arg: "debt" },
                      {
                        type: "amount",
                        value: op[1].delta_collateral,
                        arg: "collateral"
                      }
                    ]}
                  />
                );
              }}
            </BindToChainState.Wrapper>
          </span>
        );
        break;

      case "key_create":
        column = (
          <span>
            <Translate component="span" content="transaction.create_key" />
          </span>
        );
        break;

      case "account_create":
        column = (
          <TranslateWithLinks
            string="operation.reg_account"
            keys={[
              { type: "account", value: op[1].registrar, arg: "registrar" },
              { type: "account", value: op[1].name, arg: "new_account" }
            ]}
          />
        );
        break;

      case "account_update":
        column = (
          <span>
            <TranslateWithLinks
              string="operation.update_account"
              keys={[{ type: "account", value: op[1].account, arg: "account" }]}
            />
          </span>
        );

        break;

      case "account_whitelist":
        let label =
          op[1].new_listing === listings.no_listing
            ? "unlisted_by"
            : op[1].new_listing === listings.white_listed
              ? "whitelisted_by"
              : "blacklisted_by";
        column = (
          <span>
            <TranslateWithLinks
              string={"operation." + label}
              keys={[
                {
                  type: "account",
                  value: op[1].authorizing_account,
                  arg: "lister"
                },
                { type: "account", value: op[1].account_to_list, arg: "listee" }
              ]}
            />
          </span>
        );
        break;

      case "account_upgrade":
        column = (
          <span>
            <TranslateWithLinks
              string={
                op[1].upgrade_to_lifetime_member
                  ? "operation.lifetime_upgrade_account"
                  : "operation.annual_upgrade_account"
              }
              keys={[
                {
                  type: "account",
                  value: op[1].account_to_upgrade,
                  arg: "account"
                }
              ]}
            />
          </span>
        );
        break;

      case "account_transfer":
        column = (
          <span>
            <TranslateWithLinks
              string="operation.account_transfer"
              keys={[
                { type: "account", value: op[1].account_id, arg: "account" },
                { type: "account", value: op[1].new_owner, arg: "to" }
              ]}
            />
          </span>
        );
        break;

      case "asset_create":
        color = "warning";
        column = (
          <span>
            <TranslateWithLinks
              string="operation.asset_create"
              keys={[
                { type: "account", value: op[1].issuer, arg: "account" },
                { type: "asset", value: op[1].symbol, arg: "asset" }
              ]}
            />
          </span>
        );
        break;

      case "asset_update":
      case "asset_update_bitasset":
        color = "warning";
        column = (
          <span>
            <TranslateWithLinks
              string="operation.asset_update"
              keys={[
                { type: "account", value: op[1].issuer, arg: "account" },
                { type: "asset", value: op[1].asset_to_update, arg: "asset" }
              ]}
            />
          </span>
        );
        break;

      case "asset_update_feed_producers":
        color = "warning";

        column = (
          <span>
            <TranslateWithLinks
              string="operation.asset_update_feed_producers"
              keys={[
                { type: "account", value: op[1].issuer, arg: "account" },
                { type: "asset", value: op[1].asset_to_update, arg: "asset" }
              ]}
            />
          </span>
        );
        break;

      case "asset_issue":
        color = "warning";

        if (op[1].memo) {
          memoComponent = <MemoText memo={op[1].memo} />;
        }

        op[1].asset_to_issue.amount = parseInt(op[1].asset_to_issue.amount, 10);
        column = (
          <span>
            <TranslateWithLinks
              string="operation.asset_issue"
              keys={[
                { type: "account", value: op[1].issuer, arg: "account" },
                { type: "amount", value: op[1].asset_to_issue, arg: "amount" },
                { type: "account", value: op[1].issue_to_account, arg: "to" }
              ]}
            />
            {memoComponent}
          </span>
        );
        break;

      case "asset_fund_fee_pool":
        color = "warning";

        column = (
          <span>
            <TranslateWithLinks
              string="operation.asset_fund_fee_pool"
              keys={[
                { type: "account", value: op[1].from_account, arg: "account" },
                { type: "asset", value: op[1].asset_id, arg: "asset" },
                {
                  type: "amount",
                  value: { amount: op[1].amount, asset_id: "1.3.0" },
                  arg: "amount"
                }
              ]}
            />
          </span>
        );
        break;

      case "asset_settle":
        color = "warning";
        column = (
          <span>
            <BindToChainState.Wrapper asset={op[1].amount.asset_id}>
              {({ asset }) => {
                let content = pickContent(
                  asset.get("symbol"),
                  "asset_settle",
                  "operation.asset_settle"
                );
                return (
                  <TranslateWithLinks
                    string={content}
                    keys={[
                      { type: "account", value: op[1].account, arg: "account" },
                      { type: "amount", value: op[1].amount, arg: "amount" }
                    ]}
                  />
                );
              }}
            </BindToChainState.Wrapper>
          </span>
        );
        break;

      case "asset_global_settle":
        color = "warning";
        column = (
          <span>
            <TranslateWithLinks
              string="operation.asset_global_settle"
              keys={[
                { type: "account", value: op[1].issuer, arg: "account" },
                { type: "asset", value: op[1].asset_to_settle, arg: "asset" },
                { type: "price", value: op[1].settle_price, arg: "price" }
              ]}
            />
          </span>
        );
        break;

      case "asset_publish_feed":
        color = "warning";
        column = (
          <span>
            <TranslateWithLinks
              string="operation.publish_feed"
              keys={[
                { type: "account", value: op[1].publisher, arg: "account" },
                {
                  type: "price",
                  value: op[1].feed.settlement_price,
                  arg: "price"
                }
              ]}
            />
          </span>
        );
        break;

      case "witness_create":
        column = (
          <span>
            <TranslateWithLinks
              string="operation.witness_create"
              keys={[
                {
                  type: "account",
                  value: op[1].witness_account,
                  arg: "account"
                }
              ]}
            />
          </span>
        );

        break;

      case "witness_update":
        column = (
          <span>
            <TranslateWithLinks
              string="operation.witness_update"
              keys={[
                {
                  type: "account",
                  value: op[1].witness_account,
                  arg: "account"
                }
              ]}
            />
          </span>
        );

        break;

      case "witness_withdraw_pay":
        console.log("witness_withdraw_pay:", op[1].witness_account);
        if (current === op[1].witness_account) {
          column = (
            <span>
              <Translate component="span" content="transaction.witness_pay" />
              &nbsp;<FormattedAsset amount={op[1].amount} asset={"1.3.0"} />
              <Translate component="span" content="transaction.to" />
              &nbsp;{this.linkToAccount(op[1].witness_account)}
            </span>
          );
        } else {
          column = (
            <span>
              <Translate component="span" content="transaction.received" />
              &nbsp;<FormattedAsset amount={op[1].amount} asset={"1.3.0"} />
              <Translate component="span" content="transaction.from" />
              &nbsp;{this.linkToAccount(op[1].witness_account)}
            </span>
          );
        }
        break;

      case "proposal_create":
        column = (
          <div className="inline-block">
            <span>
              <TranslateWithLinks
                string="operation.proposal_create"
                keys={[
                  {
                    type: "account",
                    value: op[1].fee_paying_account,
                    arg: "account"
                  }
                ]}
              />:
            </span>
            <div>
              {op[1].proposed_ops.map((o, index) => {
                return (
                  <ProposedOperation
                    op={o.op}
                    key={index}
                    index={index}
                    inverted={false}
                    hideFee={true}
                    hideOpLabel={true}
                    hideDate={true}
                    proposal={true}
                  />
                );
              })}
            </div>
          </div>
        );
        break;

      case "proposal_update":
        column = (
          <span>
            <TranslateWithLinks
              string="operation.proposal_update"
              keys={[
                {
                  type: "account",
                  value: op[1].fee_paying_account,
                  arg: "account"
                }
              ]}
            />
          </span>
        );
        break;

      case "proposal_delete":
        column = (
          <span>
            <Translate component="span" content="transaction.proposal_delete" />
          </span>
        );
        break;

      case "withdraw_permission_create":
        column = (
          <span>
            <Translate
              component="span"
              content="transaction.withdraw_permission_create"
            />
            &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
            <Translate component="span" content="transaction.to" />
            &nbsp;{this.linkToAccount(op[1].authorized_account)}
          </span>
        );
        break;

      case "withdraw_permission_update":
        column = (
          <span>
            <Translate
              component="span"
              content="transaction.withdraw_permission_update"
            />
            &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
            <Translate component="span" content="transaction.to" />
            &nbsp;{this.linkToAccount(op[1].authorized_account)}
          </span>
        );
        break;

      case "withdraw_permission_claim":
        column = (
          <span>
            <Translate
              component="span"
              content="transaction.withdraw_permission_claim"
            />
            &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
            <Translate component="span" content="transaction.to" />
            &nbsp;{this.linkToAccount(op[1].withdraw_to_account)}
          </span>
        );
        break;

      case "withdraw_permission_delete":
        column = (
          <span>
            <Translate
              component="span"
              content="transaction.withdraw_permission_delete"
            />
            &nbsp;{this.linkToAccount(op[1].withdraw_from_account)}
            <Translate component="span" content="transaction.to" />
            &nbsp;{this.linkToAccount(op[1].authorized_account)}
          </span>
        );
        break;

      case "fill_order":
        color = "success";
        o = op[1];
        column = (
          <span>
            <BindToChainState.Wrapper
              base={o.receives.asset_id}
              quote={o.pays.asset_id}
            >
              {({ base, quote }) => {
                const { marketID, first, second } = marketUtils.getMarketID(
                  base,
                  quote
                );
                const isBid = o.pays.asset_id === second.get("id");

                let priceBase = isBid ? o.receives : o.pays;
                let priceQuote = isBid ? o.pays : o.receives;
                let amount = isBid ? o.receives : o.pays;
                let receivedAmount =
                  o.fee.asset_id === amount.asset_id
                    ? amount.amount - o.fee.amount
                    : amount.amount;
                let content = pickContent(
                  base.get("symbol"),
                  "fill_order",
                  `operation.fill_order_${isBid ? "buy" : "sell"}`
                );
                return (
                  <TranslateWithLinks
                    string={content}
                    keys={[
                      {
                        type: "account",
                        value: op[1].account_id,
                        arg: "account"
                      },
                      {
                        type: "amount",
                        value: {
                          amount: receivedAmount,
                          asset_id: amount.asset_id
                        },
                        arg: "amount"
                      },
                      {
                        type: "price",
                        value: { base: priceBase, quote: priceQuote },
                        arg: "price"
                      }
                    ]}
                  />
                );
              }}
            </BindToChainState.Wrapper>
          </span>
        );
        break;

      case "global_parameters_update":
        column = (
          <span>
            <Translate
              component="span"
              content="transaction.global_parameters_update"
            />
          </span>
        );
        break;

      case "vesting_balance_create":
        column = (
          <span>
            &nbsp;{this.linkToAccount(op[1].creator)}
            <Translate
              component="span"
              content="transaction.vesting_balance_create"
            />
            &nbsp;<FormattedAsset
              amount={op[1].amount.amount}
              asset={op[1].amount.asset_id}
            />
            &nbsp;{this.linkToAccount(op[1].owner)}
          </span>
        );
        break;

      case "vesting_balance_withdraw":
        column = (
          <span>
            <TranslateWithLinks
              string="operation.vesting_balance_withdraw"
              keys={[
                { type: "account", value: op[1].owner, arg: "account" },
                { type: "amount", value: op[1].amount, arg: "amount" }
              ]}
            />
          </span>
        );
        break;

      case "worker_create":
        column = (
          <span>
            <TranslateWithLinks
              string="operation.worker_create"
              keys={[
                { type: "account", value: op[1].owner, arg: "account" },
                {
                  type: "amount",
                  value: { amount: op[1].daily_pay, asset_id: "1.3.0" },
                  arg: "pay"
                }
              ]}
              params={{
                name: op[1].name
              }}
            />
          </span>
        );
        break;

      case "balance_claim":
        color = "success";
        op[1].total_claimed.amount = parseInt(op[1].total_claimed.amount, 10);
        column = (
          <span>
            <TranslateWithLinks
              string="operation.balance_claim"
              keys={[
                {
                  type: "account",
                  value: op[1].deposit_to_account,
                  arg: "account"
                },
                { type: "amount", value: op[1].total_claimed, arg: "amount" }
              ]}
            />
          </span>
        );
        break;

      case "committee_member_create":
        column = (
          <span>
            <Translate
              component="span"
              content="transaction.committee_member_create"
            />
            &nbsp;{this.linkToAccount(op[1].committee_member_account)}
          </span>
        );
        break;

      case "transfer_to_blind":
        column = (
          <span>
            {this.linkToAccount(op[1].from)}
            &nbsp;<Translate component="span" content="transaction.sent" />
            &nbsp;<FormattedAsset
              amount={op[1].amount.amount}
              asset={op[1].amount.asset_id}
            />
          </span>
        );
        break;

      case "transfer_from_blind":
        column = (
          <span>
            {this.linkToAccount(op[1].to)}
            &nbsp;<Translate component="span" content="transaction.received" />
            &nbsp;<FormattedAsset
              amount={op[1].amount.amount}
              asset={op[1].amount.asset_id}
            />
          </span>
        );
        break;

      case "asset_claim_fees":
        color = "success";
        op[1].amount_to_claim.amount = parseInt(
          op[1].amount_to_claim.amount,
          10
        );
        column = (
          <span>
            {this.linkToAccount(op[1].issuer)}&nbsp;
            <BindToChainState.Wrapper asset={op[1].amount_to_claim.asset_id}>
              {({ asset }) => (
                <Translate
                  component="span"
                  content="transaction.asset_claim_fees"
                  balance_amount={utils.format_asset(
                    op[1].amount_to_claim.amount,
                    asset
                  )}
                  asset={asset.get("symbol")}
                />
              )}
            </BindToChainState.Wrapper>
          </span>
        );
        break;

      case "custom":
        column = (
          <span>
            <Translate component="span" content="transaction.custom" />
          </span>
        );
        break;

      case "asset_reserve":
        column = (
          <span>
            <TranslateWithLinks
              string="operation.asset_reserve"
              keys={[
                { type: "account", value: op[1].payer, arg: "account" },
                {
                  type: "amount",
                  value: op[1].amount_to_reserve,
                  arg: "amount"
                }
              ]}
            />
          </span>
        );
        break;

      case "committee_member_update_global_parameters":
        console.log("committee_member_update_global_parameters op:", op);
        column = (
          <span>
            <TranslateWithLinks
              string="operation.committee_member_update_global_parameters"
              keys={[{ type: "account", value: "1.2.0", arg: "account" }]}
            />
          </span>
        );
        break;

      case "override_transfer":
        column = (
          <TranslateWithLinks
            string="operation.override_transfer"
            keys={[
              { type: "account", value: op[1].issuer, arg: "issuer" },
              { type: "account", value: op[1].from, arg: "from" },
              { type: "account", value: op[1].to, arg: "to" },
              { type: "amount", value: op[1].amount, arg: "amount" }
            ]}
          />
        );
        break;
      case "initiate_crowdfund":
        column = (
          <TranslateWithLinks
            string="operation.init_crowd"
            keys={[
              { type: "account", value: op[1].owner, arg: "owner" },
              { type: "asset", value: op[1].asset_id, arg: "asset" }
            ]}
          />
        );
        break;
      case "participate_crowdfund":
        column = (
          <TranslateWithLinks
            string="operation.part_crowd"
            keys={[
              { type: "account", value: op[1].buyer, arg: "account" },
              {
                type: "amount",
                value: { asset_id: "1.3.0", amount: op[1].valuation },
                arg: "amount"
              }
            ]}
          />
        );
        break;
      case "withdraw_crowdfund":
        column = (
          <TranslateWithLinks
            string="operation.withdraw_crowd"
            keys={[{ type: "account", value: op[1].buyer, arg: "account" }]}
          />
        );
        break;

      default:
        console.log("unimplemented op:", op);
        column = (
          <span>
            <Link to={`/block/${block}`}>#{block}</Link>
          </span>
        );
    }

    if (this.props.csvExportMode) {
      const globalObject = ChainStore.getObject("2.0.0");
      const dynGlobalObject = ChainStore.getObject("2.1.0");
      const block_time = utils.calc_block_time(
        block,
        globalObject,
        dynGlobalObject
      );
      return (
        <div>
          <div>{block_time ? block_time.toLocaleString() : ""}</div>
          <div>{ops[op[0]]}</div>
          <div>{column}</div>
          <div>
            <FormattedAsset
              amount={parseInt(op[1].fee.amount, 10)}
              asset={op[1].fee.asset_id}
            />
          </div>
        </div>
      );
    }

    line = column ? (
      <Row
        block={block}
        type={op[0]}
        color={color}
        fee={op[1].fee}
        hideOpLabel={this.props.hideOpLabel}
        hideDate={this.props.hideDate}
        info={column}
        hideFee={this.props.hideFee}
      />
    ) : null;

    return line ? line : <tr />;
  }
}

Operation = connect(
  Operation,
  {
    listenTo() {
      return [SettingsStore];
    },
    getProps() {
      return {
        marketDirections: SettingsStore.getState().marketDirections
      };
    }
  }
);

export default Operation;
