import * as React from "react";

import { getClassName } from "utils//ClassName";
import { connect } from "alt-react";
import { ChainStore } from "cybexjs";
import GatewayStore from "stores/GatewayStore";
import { GatewayActions } from "actions/GatewayActions";
import { verifyAddress } from "services//GatewayService";
import { GATEWAY_ID } from "services/GatewayConfig";
import BindToChainState from "../Utility/BindToChainState";
import BalanceComponent from "components/Utility/BalanceComponent";
import AmountSelector from "components/Utility/AmountSelector";
import ChainTypes from "../Utility/ChainTypes";
import { Asset } from "lib/common/MarketClasses";
import Translate from "react-translate-component";
import CopyButton from "../Utility/CopyButton";
import ErrorTipBox from "../Utility/ErrorTipBox";
import Icon from "../Icon/Icon";
import counterpart from "counterpart";
import utils from "lib/common/utils";
import { debugGen } from "utils";
import LoadingIndicator from "../LoadingIndicator";
import NewDepositAddress from "./NewDepositAddress";
import { ASSETS } from "./Config";
import { checkFeeStatusAsync, checkBalance } from "lib/common/trxHelper";
import { debounce } from "lodash";
import { BaseModal } from "./BaseModal";
import { CurrentBalance } from "./Common";
import AccountActions from "actions/AccountActions";
import { calcAmount } from "utils//Asset";


const debug = debugGen("WithdrawModal");

const style = {
  position: "fixed",
  left: 0,
  top: 0
};

type props = { modalId, withdrawInfo?, open?, className?, asset, balances?, account?, issuer?, receive_asset_name?, receive_asset_symbol?};
type state = {
  withdraw_address_loading,
  withdraw_address_error?,
  withdraw_address_valid,
  error, balanceError, hasPoolBalance, hasBalance, memo, feeStatus, from_account, fee_asset_id?, feeAmount?, fadeOut, withdraw_amount, withdraw_address
};

class WithdrawModal extends React.Component<props, state> {
  nestedRef;
  static propTypes = {
    account: ChainTypes.ChainAccount.isRequired,
    issuer: ChainTypes.ChainAccount.isRequired,
    asset: ChainTypes.ChainAsset.isRequired,
    receive_asset_name: React.PropTypes.string,
    receive_asset_symbol: React.PropTypes.string,
    memo_prefix: React.PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = {
      withdraw_amount: 0,
      withdraw_address: "",
      fadeOut: false,
      fee_asset_id: "1.3.0",
      feeAmount: null,
      from_account: props.account,
      feeStatus: {},
      memo: null,
      hasPoolBalance: null,
      hasBalance: null,
      balanceError: null,
      error: false,
      withdraw_address_loading: false,
      withdraw_address_valid: false
    };
  }

  onWithdrawAmountChange = ({ amount }) => {

    this.setState({ withdraw_amount: amount });
  }

  onWithdrawAddressChanged(e) {
    this.setState({
      withdraw_address: e.target.value,
      withdraw_address_loading: true,
      withdraw_address_valid: false,
    });
    this.validateAddress(e.target.value);
  }

  _validateAddress = async (address: string) => {
    let { error, valid } = await verifyAddress(address,
      this.props.account.get("name"),
      this.props.withdrawInfo.type
    );
    if (error) {
      return this.setState({
        withdraw_address_loading: false,
        withdraw_address_valid: false,
        withdraw_address_error: true
      })
    }
    this.setState({
      withdraw_address_loading: false,
      withdraw_address_valid: valid,
    })
    debug("Valid: ", valid);
  };

  validateAddress = debounce(this._validateAddress, 250);


  componentWillMount() {
    // this._updateFee();
    // this._checkFeeStatus();
  }

  onFeeChanged({ asset }) {
    this.setState({
      fee_asset_id: asset.get("id")
    }, this._updateFee);
  }

  _updateFee(state = this.state) {
    let { fee_asset_id, from_account } = state;
    const { fee_asset_types } = this._getAvailableAssets(state);
    if (fee_asset_types.length === 1 && fee_asset_types[0] !== fee_asset_id) {
      fee_asset_id = fee_asset_types[0];
    }
    debug("UpdateFee: ", state);
    if (!from_account) return null;
    checkFeeStatusAsync({
      accountID: from_account.get("id"),
      feeID: fee_asset_id,
      options: ["price_per_kbyte"],
      data: {
        type: "memo",
        content: this.props.receive_asset_symbol + ":" + state.withdraw_address + (state.memo ? ":" + state.memo : "")
      }
    })
      .then(({ fee, hasBalance, hasPoolBalance }) => {
        // if (this.unMounted) return;

        this.setState({
          feeAmount: fee,
          hasBalance,
          hasPoolBalance,
          error: (!hasBalance || !hasPoolBalance)
        }, this._checkBalance);
      });
  }

  _getAvailableAssets(state = this.state) {
    const { from_account, feeStatus } = state;
    function hasFeePoolBalance(id) {
      if (feeStatus[id] === undefined) return true;
      return feeStatus[id] && feeStatus[id].hasPoolBalance;
    }

    function hasBalance(id) {
      if (feeStatus[id] === undefined) return true;
      return feeStatus[id] && feeStatus[id].hasBalance;
    }

    let fee_asset_types = [];
    if (!(from_account && from_account.get("balances"))) {
      return { fee_asset_types };
    }
    let account_balances = state.from_account.get("balances").toJS();
    fee_asset_types = Object.keys(account_balances).sort(utils.sortID);
    for (let key in account_balances) {
      let asset = ChainStore.getObject(key);
      let balanceObject = ChainStore.getObject(account_balances[key]);
      if (balanceObject && balanceObject.get("balance") === 0) {
        if (fee_asset_types.indexOf(key) !== -1) {
          fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
        }
      }

      if (asset) {
        // Remove any assets that do not have valid core exchange rates
        if (asset.get("id") !== "1.3.0" && !utils.isValidPrice(asset.getIn(["options", "core_exchange_rate"]))) {
          fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
        }
      }
    }

    fee_asset_types = fee_asset_types.filter(a => {
      return hasFeePoolBalance(a) && hasBalance(a);
    });

    return { fee_asset_types };
  }

  _checkFeeStatus(state = this.state) {
    let account = state.from_account;
    if (!account) return;

    const { fee_asset_types: assets } = this._getAvailableAssets(state);
    // const assets = ["1.3.0", this.props.asset.get("id")];
    let feeStatus = {};
    let p = [];
    assets.forEach(a => {
      p.push(checkFeeStatusAsync({
        accountID: account.get("id"),
        feeID: a,
        options: ["price_per_kbyte"],
        data: {
          type: "memo",
          content: "withdraw:" + GATEWAY_ID + ":" + this.props.asset + ":" + state.withdraw_address + (state.memo ? ":" + state.memo : "")
        }
      }));
    });
    Promise.all(p).then(status => {
      assets.forEach((a, idx) => {
        feeStatus[a] = status[idx];
      });
      if (!utils.are_equal_shallow(state.feeStatus, feeStatus)) {
        this.setState({
          feeStatus
        });
      }
      this._checkBalance();
    }).catch(err => {
      console.error(err);
    });
  }

  setNestedRef(ref) {
    this.nestedRef = ref;
  }

  _checkBalance() {
    const { feeAmount, withdraw_amount } = this.state;
    const { asset } = this.props;
    const balances = this.props.account.get("balances").toJS();
    let current_asset_id = this.props.asset.get("id");
    let balance = balances[current_asset_id]; //Todo
    if (!balance || !feeAmount) return;
    const hasBalance = checkBalance(withdraw_amount, asset, feeAmount, balance);
    if (hasBalance === null) return;
    this.setState({ balanceError: !hasBalance });
    return hasBalance;
  }

  onSubmit = () => {
    let precision = this.props.asset.get("precision");
    let withdrawAmount = calcAmount(this.state.withdraw_amount, precision);
    let gatewayFeeAmount = calcAmount(this.props.withdrawInfo.fee, precision);
    AccountActions.transfer(
      this.props.account.get("id"),
      this.props.withdrawInfo.gatewayAccount,
      withdrawAmount,
      this.props.asset.get("id"),
      "withdraw:" + GATEWAY_ID + ":" + this.props.withdrawInfo.type + ":" + this.state.withdraw_address,
      null,
      "1.3.0"
    );
  }

  // Subcomponent
  invalid_address_message =
    <div className="has-error" style={{ paddingTop: 10 }}>
      <Translate content="gateway.valid_address" coin_type={this.props.withdrawInfo.type} />
    </div>;

  invalid_gateway_message =
    <div className="has-error" style={{ paddingTop: 10 }}>
      <Translate content="gateway.valid_service" />
    </div>;

  // render
  render() {
    let { asset, withdrawInfo, modalId } = this.props;
    let {
      withdraw_amount,
      withdraw_address,
      withdraw_address_valid,
      withdraw_address_loading,
      withdraw_address_error,
      memo
    } = this.state;

    let balance = null;
    // console.log( "account: ", this.props.account.toJS() );
    let account_balances = this.props.account.get("balances").toJS();
    // console.log( "balances: ", account_balances );
    let asset_types = Object.keys(account_balances);
    if (asset_types.length > 0) {
      let current_asset_id = this.props.asset.get("id");
      if (current_asset_id)
        balance = (
          <span>
            <Translate component="span" content="transfer.available" />:
            <BalanceComponent
              balance={account_balances[current_asset_id]}
            />
          </span>
        );
      else
        balance = "No funds";
    } else {
      balance = "No funds";
    }
    let { fee_asset_types } = this._getAvailableAssets();


    // State Control
    let gatewayServiceInvalid =
      withdraw_address &&
      !withdraw_address_loading &&
      withdraw_address_error;

    let addressInvalid =
      withdraw_address &&
      !withdraw_address_loading &&
      !withdraw_address_valid &&
      !withdraw_address_error;

    let disableSubmit =
      !withdraw_address ||
      addressInvalid ||
      gatewayServiceInvalid ||
      withdraw_amount <= 0;

    let amountValid = Number(withdraw_amount) >= 0;

    return (
      <BaseModal modalId={modalId} >
        <div className="content-block">
          <h3><Translate content={"gateway.withdraw"} />
            {this.props.receive_asset_name}({this.props.receive_asset_symbol})
        </h3>
        </div>
        <div className="content-block">
          <AmountSelector label="modal.withdraw.amount"
            amount={this.state.withdraw_amount}
            asset={this.props.asset.get("id")}
            assets={[this.props.asset.get("id")]}
            placeholder="0.0"
            onChange={this.onWithdrawAmountChange.bind(this)}
            display_balance={balance}
          />
          <ErrorTipBox
            isTranslation={true}
            tips={[
              {
                name: "withdraw-amount",
                isError: !amountValid,
                isTranslation: true,
                message: "transfer.errors.valid"
              },
            ]}
            muiltTips={false}
          />
        </div>

        {/* Fee selection */}
        {this.state.feeAmount ? <div className="content-block gate_fee">
          <AmountSelector
            refCallback={this.setNestedRef.bind(this)}
            label="transfer.fee"
            disabled={true}
            amount={this.state.feeAmount.getAmount({ real: true })}
            onChange={this.onFeeChanged.bind(this)}
            asset={this.state.feeAmount.asset_id}
            assets={fee_asset_types}
          />
          {!this.state.hasBalance ? <p className="has-error no-margin" style={{ paddingTop: 10 }}><Translate content="transfer.errors.noFeeBalance" /></p> : null}
          {!this.state.hasPoolBalance ? <p className="has-error no-margin" style={{ paddingTop: 10 }}><Translate content="transfer.errors.noPoolBalance" /></p> : null}
        </div> : null}

        {/* Gate fee */}
        {this.props.withdrawInfo.fee ?
          (<div className="amount-selector right-selector" style={{ paddingBottom: 20 }}>
            <label className="left-label"><Translate content="gateway.fee" /></label>
            <div className="inline-label input-wrapper">
              <input type="text" disabled value={this.props.withdrawInfo.fee} />

              <div className="form-label select floating-dropdown">
                <div className="dropdown-wrapper inactive">
                  <div>{withdrawInfo.type}</div>
                </div>
              </div>
            </div>
          </div>) : null}
        <div className="content-block">
          <label className="left-label">
            <Translate component="span" content="modal.withdraw.address" />
          </label>
          <div className="blocktrades-select-dropdown">
            <div className="inline-label">
              <input type="text" value={withdraw_address} onChange={this.onWithdrawAddressChanged.bind(this)} autoComplete="off" />
              {/* <span onClick={this.onDropDownList.bind(this)} >&#9660;</span> */}
              {/* <span onClick={this.onDropDownList.bind(this)} >&#9660;</span> */}
            </div>
          </div>
          <ErrorTipBox
            isTranslation={true}
            tips={[
              {
                name: "withdraw-address",
                isError: addressInvalid,
                isTranslation: true,
                message: "gateway.valid_address",
                messageParams: {
                  coin_type: this.props.withdrawInfo.type
                }
              },
              {
                name: "withdraw-gateway",
                isError: gatewayServiceInvalid,
                isTranslation: true,
                message: "gateway.valid_service"
              },
            ]}
            muiltTips={false}
          />
        </div>
        {/* Withdraw/Cancel buttons */}
        <div className="button-group">
          <Translate
            content="modal.withdraw.submit"
            onClick={this.onSubmit}
            className={"button" + (disableSubmit ? (" disabled") : "")}
          />
        </div>
      </BaseModal>
    );
  }
}

// let WithdrawModalWrapper = WithdrawModal;
let WithdrawModalWrapper = BindToChainState(WithdrawModal, { keep_updating: true, show_loader: true });

WithdrawModalWrapper = connect(WithdrawModalWrapper, {
  listenTo() {
    return [GatewayStore];
  },
  getProps(props) {
    let { modalId } = props;
    debug("connect", props);
    let withdrawInfo = GatewayStore.getState().withdrawInfo;
    return {
      open: GatewayStore.getState().modals.get(modalId),
      withdrawInfo,
      receive_asset_symbol: withdrawInfo.type,
      asset: GatewayStore.getState().withdrawInfo.asset
    };
  }
});


export default WithdrawModalWrapper;