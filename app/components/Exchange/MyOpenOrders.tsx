import * as React from "react";
import * as PropTypes from "prop-types";

import { Link } from "react-router-dom";
import { FormattedDate } from "react-intl";
// import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import PriceText from "../Utility/PriceText";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";
import Icon from "../Icon/Icon";
import { ChainStore } from "cybexjs";
import { LimitOrder, CallOrder } from "common/MarketClasses";
const rightAlign: any = { textAlign: "right" };
import { EquivalentValueComponent } from "../Utility/EquivalentValueComponent";

class TableHeader extends React.Component<any, any> {
  static defaultProps = {
    quoteSymbol: null,
    baseSymbol: null
  };
  render() {
    let {
      baseSymbol,
      quoteSymbol,
      dashboard,
      isMyAccount,
      settings
    } = this.props;
    let preferredUnit = settings ? settings.get("unit") : "1.3.0";

    return !dashboard ? (
      <thead>
        <tr>
          <th className="text-right">
            <Translate className="header-sub-title" content="exchange.price" />
          </th>
          <th className="text-right">
            {baseSymbol ? (
              <span className="header-sub-title">
                <AssetName dataPlace="top" name={quoteSymbol} />
              </span>
            ) : null}
          </th>
          <th className="text-right">
            {baseSymbol ? (
              <span className="header-sub-title">
                <AssetName dataPlace="top" name={baseSymbol} />
              </span>
            ) : null}
          </th>
          <th
            className="text-right"
            style={{
              width: "28%"
            }}
          >
            <Translate
              className="header-sub-title"
              content="transaction.expiration"
            />
          </th>
          <th style={{ whiteSpace: "nowrap" }}>
            <Translate content="wallet.cancel" />
          </th>
        </tr>
      </thead>
    ) : (
      <thead>
        <tr>
          <th>
            <Translate content="account.cyb_market" />
          </th>
          <th style={rightAlign}>
            <Translate content="exchange.price" />
          </th>
          <th style={rightAlign}>
            <Translate content="account.qty" />
          </th>
          <th style={rightAlign}>
            <Translate content="exchange.total" />
          </th>
          <th style={rightAlign}>
            <Translate content="exchange.order_value" /> (<AssetName
              name={preferredUnit}
            />)
          </th>
          <th>
            <Translate content="account.trade" />
          </th>
          {/* <th><Translate content="transaction.expiration" /></th> */}
          <th>
            <Translate content="wallet.cancel" />
          </th>
        </tr>
      </thead>
    );
  }
}

class OrderRow extends React.Component<any, any> {
  static defaultProps = {
    showSymbols: false
  };
  shouldComponentUpdate(nextProps) {
    return (
      nextProps.order.for_sale !== this.props.order.for_sale ||
      nextProps.order.id !== this.props.order.id ||
      nextProps.isMyAccount !== this.props.isMyAccount ||
      nextProps.quote !== this.props.quote ||
      nextProps.base !== this.props.base ||
      nextProps.order.market_base !== this.props.order.market_base
    );
  }

  render() {
    let {
      base,
      quote,
      order,
      showSymbols,
      dashboard,
      isMyAccount,
      settings
    } = this.props;
    const isBid = order.isBid();
    const isCall = order.isCall();
    let tdClass =
      (isCall
        ? "orderHistoryCall"
        : isBid
          ? "orderHistoryBid"
          : "orderHistoryAsk") + " text-right";

    let priceSymbol = showSymbols ? (
      <span>{` ${base.get("symbol")}/${quote.get("symbol")}`}</span>
    ) : null;
    let valueSymbol = showSymbols ? " " + base.get("symbol") : null;
    let amountSymbol = showSymbols ? " " + quote.get("symbol") : null;
    let preferredUnit = settings ? settings.get("unit") : "1.3.0";

    return !dashboard ? (
      <tr key={order.id}>
        <td className={tdClass} style={{ paddingLeft: 10 }}>
          <PriceText price={order.getPrice()} base={base} quote={quote} />
          {priceSymbol}
        </td>
        <td className="text-right">
          {utils.format_number(
            order[!isBid ? "amountForSale" : "amountToReceive"]().getAmount({
              real: true
            }),
            quote.get("precision")
          )}{" "}
          {amountSymbol}
        </td>
        <td className="text-right">
          {utils.format_number(
            order[!isBid ? "amountToReceive" : "amountForSale"]().getAmount({
              real: true
            }),
            base.get("precision")
          )}{" "}
          {valueSymbol}
        </td>
        <td className="text-right" style={{ width: "28%" }}>
          {isCall ? null : (
            <FormattedDate value={order.expiration} format="short" />
          )}
        </td>
        <td className="text-center" style={{ padding: "2px 5px" }}>
          {isCall ? null : (
            <a
              style={{ marginRight: 0 }}
              className="order-cancel"
              onClick={this.props.onCancel}
            >
              <Icon name="cross-circle" className="icon-14px" />
            </a>
          )}
        </td>
      </tr>
    ) : (
      <tr key={order.id}>
        <td
          style={{ textAlign: "center", paddingLeft: 0, borderRight: "none" }}
        >
          <Link to={`/asset/${quote.get("symbol")}`}>
            <AssetName noTip name={quote.get("symbol")} />
          </Link>
          /
          <Link to={`/asset/${base.get("symbol")}`}>
            <AssetName noTip name={base.get("symbol")} />
          </Link>
        </td>
        <td className={tdClass} style={rightAlign}>
          <PriceText price={order.getPrice()} base={base} quote={quote} />
          {priceSymbol}
        </td>
        <td style={rightAlign}>
          {utils.format_number(
            order[!isBid ? "amountForSale" : "amountToReceive"]().getAmount({
              real: true
            }),
            quote.get("precision")
          )}{" "}
          {amountSymbol}
        </td>
        <td style={rightAlign}>
          {utils.format_number(
            order[!isBid ? "amountToReceive" : "amountForSale"]().getAmount({
              real: true
            }),
            base.get("precision")
          )}{" "}
          {valueSymbol}
        </td>
        <td className="text-right">
          <EquivalentValueComponent
            hide_asset
            amount={order.amountForSale().getAmount()}
            fromAsset={order.amountForSale().asset_id}
            noDecimals={true}
            toAsset={preferredUnit}
          />
        </td>
        {/* <td>
                    {isCall ? null : <FormattedDate
                        value={order.expiration}
                        format="short"
                    />}
                </td> */}
        <td>
          <Link to={`/market/${quote.get("symbol")}_${base.get("symbol")}`}>
            <Icon name="trade" className="icon-14px" />
          </Link>
        </td>
        <td className="text-center" style={{ padding: "2px 5px" }}>
          {isCall ? null : (
            <a
              style={{ marginRight: 0 }}
              className="order-cancel"
              onClick={this.props.onCancel}
            >
              <Icon name="cross-circle" className="icon-14px" />
            </a>
          )}
        </td>
      </tr>
    );
    // }
  }
}

class MyOpenOrders extends React.Component<any, any> {
  static defaultProps = {
    base: {},
    quote: {},
    orders: {},
    quoteSymbol: "",
    baseSymbol: ""
  };

  static propTypes = {
    base: PropTypes.object.isRequired,
    quote: PropTypes.object.isRequired,
    orders: PropTypes.object.isRequired,
    quoteSymbol: PropTypes.string.isRequired,
    baseSymbol: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);

    this._getOrders = this._getOrders.bind(this);
  }

  componentDidMount() {
    // let asksContainer = this.refs.asks;
    // if (asksContainer) Ps.initialize(asksContainer);
  }

  componentDidUpdate() {
    // let asksContainer = this.refs.asks;
    // if (asksContainer) Ps.update(asksContainer);
  }

  _getOrders() {
    const { currentAccount, base, quote } = this.props;
    const orders = currentAccount.get("orders"),
      call_orders = currentAccount.get("call_orders");
    const baseID = base.get("id"),
      quoteID = quote.get("id");
    const assets = {
      [base.get("id")]: { precision: base.get("precision") },
      [quote.get("id")]: { precision: quote.get("precision") }
    };
    let limitOrders = orders
      .toArray()
      .map(order => {
        let o = ChainStore.getObject(order);
        if (!o) return null;
        let sellBase = o.getIn(["sell_price", "base", "asset_id"]),
          sellQuote = o.getIn(["sell_price", "quote", "asset_id"]);
        if (
          (sellBase === baseID && sellQuote === quoteID) ||
          (sellBase === quoteID && sellQuote === baseID)
        ) {
          return new LimitOrder(o.toJS(), assets, quote.get("id"));
        }
      })
      .filter(a => !!a);

    let callOrders = call_orders
      .toArray()
      .map(order => {
        let o = ChainStore.getObject(order);
        if (!o) return null;
        let sellBase = o.getIn(["call_price", "base", "asset_id"]),
          sellQuote = o.getIn(["call_price", "quote", "asset_id"]);
        if (
          (sellBase === baseID && sellQuote === quoteID) ||
          (sellBase === quoteID && sellQuote === baseID)
        ) {
          return this.props.feedPrice
            ? new CallOrder(
                o.toJS(),
                assets,
                quote.get("id"),
                this.props.feedPrice
              )
            : null;
        }
      })
      .filter(a => !!a)
      .filter(a => a.isMarginCalled());
    return limitOrders.concat(callOrders);
  }

  render() {
    let { base, quote, quoteSymbol, baseSymbol } = this.props;
    if (!base || !quote) return null;

    const orders = this._getOrders();
    let emptyRow = (
      <tr>
        <td style={{ textAlign: "center" }} colSpan={5}>
          <Translate content="account.no_orders" />
        </td>
      </tr>
    );

    let bids = orders
      .filter(a => {
        return a.isBid();
      })
      .sort((a, b) => {
        return b.getPrice() - a.getPrice();
      })
      .map(order => {
        let price = order.getPrice();
        return (
          <OrderRow
            price={price}
            key={order.id}
            order={order}
            base={base}
            quote={quote}
            onCancel={this.props.onCancel.bind(this, order.id)}
          />
        );
      });

    let asks = orders
      .filter(a => {
        return !a.isBid();
      })
      .sort((a, b) => {
        return a.getPrice() - b.getPrice();
      })
      .map(order => {
        let price = order.getPrice();
        return (
          <OrderRow
            price={price}
            key={order.id}
            order={order}
            base={base}
            quote={quote}
            onCancel={this.props.onCancel.bind(this, order.id)}
          />
        );
      });

    let rows = [];

    if (asks.length) {
      rows = rows.concat(asks);
    }

    if (bids.length) {
      rows = rows.concat(bids);
    }

    rows.sort((a, b) => {
      return a.props.price - b.props.price;
    });

    return (
      <React.Fragment>
        <div className="exchange-content-header">
          <Translate content="exchange.my_orders" />
        </div>
        <table className="table order-table table-hover">
          <TableHeader
            type="sell"
            baseSymbol={baseSymbol}
            quoteSymbol={quoteSymbol}
          />
        </table>
        <div
          className="grid-block no-padding market-right-padding _scroll-bar"
          ref="asks"
          style={{ overflow: "auto", maxHeight: 720 }}
        >
          <table
            style={{ paddingBottom: 5 }}
            className="table order-table table-hover"
          >
            <TransitionWrapper component="tbody" transitionName="newrow">
              {rows.length ? rows : emptyRow}
            </TransitionWrapper>
          </table>
        </div>
      </React.Fragment>
    );
  }
}

export { OrderRow, TableHeader, MyOpenOrders };
