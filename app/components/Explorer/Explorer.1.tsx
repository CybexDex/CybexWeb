import * as React from "react";
import { Link } from "react-router-dom";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";
import { Route, Switch, Redirect } from "react-router-dom";
import { LoadComponent } from "Routes";
import Blocks from "./BlocksContainer";
import Assets from "./AssetsContainer";
import Accounts from "./AccountsContainer";
import Committee from "./CommitteeMembers";
import Witnesses from "./Witnesses";
import Fees from "components/Blockchain/FeesContainer";

class ExplorerCard extends React.Component {
  render() {
    return (
      <div className="grid-content">
        <div className="card">{this.props.children}</div>
      </div>
    );
  }
}
class Explorer extends React.Component {
  render() {
    return (
      <div className="grid-block page-layout flex-start">
        <div>
          <Switch>
            <Route path="/explorer/blocks" exact component={Blocks as any} />
            <Route path="/explorer/accounts" component={Accounts as any} />
            <Route path="/explorer/assets" component={Assets as any} />
            <Route path="/explorer/committee" component={Committee as any} />
            <Route path="/explorer/witnesses" component={Witnesses as any} />
            <Route path="/explorer/fees" component={Fees as any} />
            <Redirect from="*" to="/explorer/blocks" />
          </Switch>
        </div>
        <div className="grid-block regular-padding small-up-1 medium-up-2 large-up-3">
          <ExplorerCard>
            <Link to="blocks">
              <div>
                <Icon name="blocks" size="5x" fillClass="fill-black" />
              </div>
              <div className="card-divider text-center">
                <Translate component="span" content="explorer.blocks.title" />
              </div>
            </Link>
          </ExplorerCard>
          <ExplorerCard>
            <Link to="assets">
              <div>
                <Icon name="assets" size="5x" fillClass="fill-black" />
              </div>
              <div className="card-divider text-center">
                <Translate component="span" content="explorer.assets.title" />
              </div>
            </Link>
          </ExplorerCard>
          <ExplorerCard>
            <Link to="accounts">
              <div>
                <Icon name="accounts" size="5x" fillClass="fill-black" />
              </div>
              <div className="card-divider text-center">
                <Translate component="span" content="explorer.accounts.title" />
              </div>
            </Link>
          </ExplorerCard>
          <ExplorerCard>
            <Link to="witnesses">
              <div>
                <Icon name="witnesses" size="5x" fillClass="fill-black" />
              </div>
              <div className="card-divider text-center">
                <Translate
                  component="span"
                  content="explorer.witnesses.title"
                />
              </div>
            </Link>
          </ExplorerCard>
          <ExplorerCard>
            <Link to="committee">
              <div>
                <Icon
                  name="committee_members"
                  size="5x"
                  fillClass="fill-black"
                />
              </div>
              <div className="card-divider text-center">
                <Translate
                  component="span"
                  content="explorer.committee_members.title"
                />
              </div>
            </Link>
          </ExplorerCard>
          {/* <ExplorerCard>
            <Link to="markets">
              <div>
                <Icon name="markets" size="5x" fillClass="fill-black" />
              </div>
              <div className="card-divider text-center">
                <Translate component="span" content="markets.title" />
              </div>
            </Link>
          </ExplorerCard> */}
          <ExplorerCard>
            <Link to="fees">
              <div>
                <Icon name="fees" size="5x" fillClass="fill-black" />
              </div>
              <div className="card-divider text-center">
                <Translate component="span" content="fees.title" />
              </div>
            </Link>
          </ExplorerCard>
        </div>
      </div>
    );
  }
}

export default Explorer;
