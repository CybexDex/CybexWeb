import * as React from "react";
import * as PropTypes from "prop-types";
// import { Provider } from 'react-redux';
// import configureStore from './configureStore.js';
// import EOComponent from './Eo';
// import EoStore from "stores/EoStore";
// const store = configureStore();
import jdenticon from "jdenticon";
import sha256 from "js-sha256";
import { Link } from "react-router"; 
import "./detail.scss";
let logo_demo = require('assets/cybex_rainbow_lg.png');

class Detail extends React.Component<any, any> {
  // nestedRef;
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  componentDidMount(){

  }



  render() {
    return (
      <div className="detail">
        <div className="left-part">
        <img src={logo_demo} />
        <div className="info-item">
          <div className="percent">
            <div className="percent-in"></div>
          </div>
          <div className="info-text">30%</div>
        </div>
        <div className="info-item">
          <div className="info-title">Item name:</div>
          <div className="info-detail">CYB</div>
        </div>
        <div className="info-item">
          <div className="info-title">Amount:</div>
          <div className="info-detail">10000</div>
        </div>
        <div className="info-item">
          <div className="info-title">Item percent:</div>
          <div className="info-detail">50%</div>
        </div>
        
        
        
        </div>
        <div className="right-part">
          <h3 className="title">Title</h3>
          <p>1 convallis timestamp</p>
          <div className="info-item">
            <div className="info-title">Item Name:</div>
            <div className="info-detail">CYB</div>
          </div>
          <div className="info-item">
            <div className="info-title">Amount:</div>
            <div className="info-detail">1000</div>
          </div>
          <div className="info-item">
            <div className="info-title">Item percent:</div>
            <div className="info-detail">50%</div>
          </div>
          <div className="info-item">
            <div className="info-title">Finish Time:</div>
            <div className="info-detail">10:00</div>
          </div>
          <div className="info-item">
            <div className="info-title">End Time:</div>
            <div className="info-detail">20:00</div>
          </div>
          <div className="info-item">
            <div className="info-title">Details:</div>
            <div className="info-detail">Asdfdasf dsfsadfdsaf Fdlskjfadsf</div>
          </div>
          <div className="button-holder">
          <Link to={`/eo/detail/123`}>
          <div className="button primery-button">Join Item</div>
          </Link>
          </div>
        </div>
      </div>
    );
  }
}
 export default Detail;
