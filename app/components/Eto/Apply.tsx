import * as React from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import AltContainer from "alt-container";
import AccountStore from "stores/AccountStore";
import { RouterStore } from "stores/RouterStore";
import { RouterActions } from "actions/RouterActions";
import { EtoActions } from "actions/EtoActions";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import { connect } from "alt-react";
import { EtoStore } from "stores/EtoStore";
import { EtoInfoForm } from "./EtoInfoForm";
import { Eto } from "../../services/eto";
import { EtoSurveyForm } from "./EtoSurveyForm";
import { EtoApplyDone } from "./EtoApplyDone";
import { EtoCenter } from "./EtoCenter";
import WalletUnlockActions from "actions/WalletUnlockActions";
import { Gtag } from "services/Gtag";
import { LoadingIndicator } from "../LoadingIndicator";
import EtoTokenModal from "./EtoCheckToken";
import { DEFAULT_ETO_CHECK_TOKEN } from "../Modal/ModalID";
import { DepositModal } from "../Gateway/DepositModal";
import { DEPOSIT_MODAL_ID } from "../../actions/GatewayActions";
import { GatewayStore } from "../../stores/GatewayStore";

type EtoProps = {
  linkedAccounts: any;
  account: any;
  depositModal?: boolean;
  accountsReady: any;
  myIgnoredAccounts: any;
  passwordAccount: any;
} & RouteComponentProps<{}>;
let EtoApply = class extends React.Component<EtoProps> {
  static propTypes = {
    account: ChainTypes.ChainAccount.isRequired
  };

  componentWillMount() {
    let { etoState, account } = this.props as any;
    if (etoState.state === Eto.EtoPersonalState.Uninit) {
      WalletUnlockActions.unlock()
        .then(() => {
          EtoActions.queryInfo(account);
        })
        .catch(err => {
          this.props.history.goBack();
        });
    }
  }
  componentDidUpdate(prevProps) {
    let { etoState, account } = this.props as any;
    if (
      etoState.state === Eto.EtoPersonalState.Uninit &&
      etoState.state !== prevProps.etoState.state
    ) {
      WalletUnlockActions.unlock()
        .then(() => {
          EtoActions.queryInfo(account);
        })
        .catch(err => {
          console.error(err);
          this.props.history.goBack();
        });
    }
  }
  // 申请期结束 开这个
  // render() {
  //   let { etoState, account } = this.props as any;
  //   return (
  //     <>
  //       {etoState.state ===
  //       Eto.EtoPersonalState.Uninit ? null : etoState.state ===
  //           Eto.EtoPersonalState.Basic ||
  //         etoState.state === Eto.EtoPersonalState.Survey ? (
  //         <EtoCenter overtime {...this.props} />
  //       ) : etoState.state === Eto.EtoPersonalState.Lock ? (
  //         <EtoCenter {...this.props} />
  //       ) : (
  //         <h1>Unknown</h1>
  //       )}
  //       {/* <EtoTokenModal modalId={DEFAULT_ETO_CHECK_TOKEN} account={account} /> */}
  //       {this.props.depositModal && (
  //         <DepositModal
  //           balances={account.get("balances", null)}
  //           modalId={DEPOSIT_MODAL_ID}
  //           fade={true}
  //         />
  //       )}
  //     </>
  //   );
  // }
  // 申请进行时 开这个
  render() {
    let { etoState, account } = this.props as any;
    return (
      <>
        {etoState.state ===
        Eto.EtoPersonalState.Uninit ? null : //     width: "100vw", //     position: "fixed", //     height: "100vh", //   style={{ // <LoadingIndicator
        //     textAlign: "center",
        //     top: 0,
        //     left: 0,
        //     lineHeight: "100vh",
        //     zIndex: 1
        //   }}
        //   type="three-bounce"
        // />
        etoState.state === Eto.EtoPersonalState.Basic ? (
          <EtoInfoForm
            onSubmit={form => EtoActions.putBasic(form, this.props.account)}
            account={this.props.account.get("name")}
          />
        ) : etoState.state === Eto.EtoPersonalState.Survey ? (
          <EtoSurveyForm
            onSubmit={form => EtoActions.putSurvey(form, this.props.account)}
            account={this.props.account.get("name")}
          />
        ) : etoState.state === Eto.EtoPersonalState.ApplyDone ? (
          <EtoApplyDone {...this.props} />
        ) : etoState.state === Eto.EtoPersonalState.Lock ? (
          <EtoCenter {...this.props} />
        ) : (
          <h1>Unknown</h1>
        )}
        <EtoTokenModal modalId={DEFAULT_ETO_CHECK_TOKEN} account={account} />
        {this.props.depositModal && (
          <DepositModal
            balances={account.get("balances", null)}
            modalId={DEPOSIT_MODAL_ID}
            fade={true}
          />
        )}
      </>
    );
  }
};
EtoApply = BindToChainState(EtoApply);

let EtoApplyWrapper = class extends React.Component<EtoProps> {
  componentWillMount() {
    console.debug("WillMount: ", this.props);
    let {
      linkedAccounts,
      myIgnoredAccounts,
      passwordAccount,
      account
    } = this.props;
    let accountCount =
      linkedAccounts.size + myIgnoredAccounts.size + (passwordAccount ? 1 : 0);
    if (!accountCount) {
      RouterActions.setDeferRedirect("/eto/apply");
      this.props.history.push("/login");
    } else {
      RouterActions.setDeferRedirect("");
    }
  }

  render() {
    return (
      <div className="grid-container">
        <div style={{ padding: "6px" }} />
        <EtoApply {...this.props} />
      </div>
    );
  }
} as any;

EtoApplyWrapper = connect(
  EtoApplyWrapper,
  {
    listenTo() {
      return [AccountStore, RouterStore, EtoStore];
    },
    getProps() {
      return {
        depositModal: GatewayStore.getState().modals.get(DEPOSIT_MODAL_ID),
        etoState: EtoStore.getState(),
        account: AccountStore.getState().currentAccount,
        linkedAccounts: AccountStore.getState().linkedAccounts,
        myIgnoredAccounts: AccountStore.getState().myIgnoredAccounts,
        passwordAccount: AccountStore.getState().passwordAccount,
        accountsReady:
          AccountStore.getState().accountsLoaded &&
          AccountStore.getState().refsLoaded
      };
    }
  }
) as any;
export { EtoApplyWrapper as EtoApply };
export default EtoApplyWrapper;
