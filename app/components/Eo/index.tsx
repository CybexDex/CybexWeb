import * as React from "react";
import * as PropTypes from "prop-types";
// import { Provider } from 'react-redux';
// import configureStore from './configureStore.js';
// import EOComponent from './Eo';
// import EoStore from "stores/EoStore";
// const store = configureStore();
import Anthem from './anthem';
import jdenticon from "jdenticon";
import sha256 from "js-sha256";
import { Link } from "react-router"; 
let logo_demo = require('assets/cybex_rainbow_lg.png');
import ReactSwipe from 'react-swipe';
import * as fetchJson from "./service";
import './transfer.scss';
import Translate from "react-translate-component";
import BindToChainState from "../Utility/BindToChainState";
import AccountInfo from "../Account/AccountInfo";
import { connect } from "alt-react";
import AccountStore from "stores/AccountStore";
import moment from "moment";
import * as humanize from "./humanize.js";
import Swiper from 'react-id-swiper';
import Icon from "../Icon/Icon";
import './swiper.scss';

class EO extends React.Component<any, any> {
  // nestedRef;
  constructor(props) {
    super(props);
    this.state = {
      data:[[]],
      offset:0,
      showMore: 'block'
    };

  }
  canClick = true;
  componentDidMount(){
    fetchJson.fetchJsonList(this.state.offset, (data)=>{
      let showMore = 'block';
      if(data.result.length < 4){
        showMore = 'none';
      }
      let newDate = this.state.data;
      newDate[0] = data.result;
      let bannerData = [];
      data.result.map((e) => {
        e.adds_banner && bannerData.push(e.adds_banner);
      })
      this.setState({
        offset: this.state.offset+4,
        data: newDate,
        showMore: showMore,
        // bannerData
      });
    });
    fetchJson.fetchBanner((res)=>{
      this.setState({
        bannerData: res.result
      });
    })
    fetchJson.fetchKYC({cybex_name: this.props.myAccounts[0]}, (res)=>{
      this.setState({kyc_status: res.result});
    })
  }
  next() {
    this.reactSwipe.next();
  }

  prev() {
    this.reactSwipe.prev();
  }
  
  addMore() {
    
    if(this.canClick){
      this.canClick = false;
      fetchJson.fetchJsonList(this.state.offset, (data)=>{
        let showMore = 'block';
        if(data.result.length < 4){
          showMore = 'none';
        }
        if(data.result.length>0){
          let newDate = this.state.data;
          newDate[this.state.offset/4] = data.result
          this.setState({
            offset: this.state.offset+4,
            data: newDate,
            showMore: showMore
          }, ()=>{
            this.canClick = true;
          });
        }else{
          this.setState({
            showMore: showMore
          })
        }
      });
    }
    
  }
  formatTime(input){
    return moment(moment.utc(input).toDate()).local().format('YYYY-MM-DD HH:mm:ss');
  }
  render() {

    const data = this.state.data || [];
    const bannerData = this.state.bannerData || [];
    const params = {
      spaceBetween: 30,
      autoplay: {
        delay: 2500
      },
      // pagination: {
      //   el: '.swiper-pagination',
      //   clickable: true,
      // }
    };
    
    // overflow: hidden;
    // text-overflow: ellipsis;
    // display: -webkit-box;
    // -webkit-line-clamp: 2;
    // -webkit-box-orient: vertical;
    // font-size: 14px;
    // line-height: 22px;
    // width: 200px;

    return (
      <div>
        <div className="slider-holder">
        <Swiper {...params}>
          {bannerData.map((e,i)=>{
            return(
              <div key={i}>
                <div className="item">
                <Link to={`/eto/detail/${e.id}`}>
                  <div className="img-content">
                  <img src={`${e.adds_banner}`} width={1280} height={656} />
                  </div>
                </Link>
                </div>
              </div>
            )
          })}
        </Swiper>
        </div>

        {/* {this.state.kyc_status=="not_start"?( */}
          <div className="title-container">
          {/* <Link to="/eto/training"> */}
          <h2 className="base-title">
          | <Translate content="EIO.Popular_ETOs" />
          </h2>
          <a href="https://www.icoape.com/" target="_blank">
          <div className="kyc-btn button primery-button">
          
            {/* <Translate content="EIO.KYC_Verification" /> */}
            <Translate content="EIO.Accept_KYC_Verification" />
          
          </div>
          </a>
          {/* </Link> */}
        </div>
        {/* ):null */}
      <div className="container">
      {data.map((f,j) => {
        if(f.length<4 && f.length !== 0){
          let comingSoonLength = 4 - f.length;
          for(let i = 0; i< comingSoonLength; i++){
            f.push({comingSoon: true});
          }
        }
        return (
          <div key={`w-${j}`} className="waterfall">
      {f.map((e,i)=>{
        let percent = e.current_percent*100;
        percent = percent.toFixed(2);
        let showPercent = `${percent>99?99:(percent<2?(percent==0?0:2):percent)}%`;
        let end_at = this.formatTime(e.end_at);
        let start_at = this.formatTime(e.start_at);
        let created_at = this.formatTime(e.created_at);
        let finish_at = this.formatTime(e.finish_at);
        // let endAt = moment(e.end_at);
        // let now = moment();
        // let remainStr = ` 剩余 ${endAt.diff(now,'days')}天  ${moment(moment(e.end_at).valueOf() - moment().valueOf()).format('hh')}小时`
        
        let countDownTime = moment(end_at).valueOf() - moment().valueOf();
        let endAt = moment(end_at);
        let startAt = moment(start_at);
        let finishAt = moment(finish_at);
        let createAt = moment(created_at);
        let now = moment();
        // let remainStr = `${endAt.diff(now,'days')} ${moment(this.state.countDownTime).format('hh:mm')}`
        let remainStr;
        let projectStatus;

        const shortEnglishHumanizer = humanize.humanizer({
          language: 'shortEn',
          units: ['mo', 'd', 'h', 'm'],
          unitMeasures: {
            y: 365 * 86400000,
            mo: 30 * 86400000,
            w: 7 * 86400000,
            d: 86400000,
            h: 3600000,
            m: 60000,
            s: 1000
          },
          round: true,
          languages: {
            shortEn: {
              y: function() { return '年' },
              mo: function() { return '月' },
              d: function() { return '天' },
              h: function() { return '小时' },
              m: function() { return '分钟' },
              s: function() { return '秒' }
            }
          }
        })
        switch(e.status){
          case 'pre':
          countDownTime = moment(startAt).valueOf() - moment().valueOf();
          remainStr = shortEnglishHumanizer(startAt.diff(now)).replace(/[\,]/g,'');
          break;
          case 'finish':
          countDownTime = moment(finishAt).valueOf() - moment(endAt).valueOf();
          remainStr = shortEnglishHumanizer(endAt.diff(startAt)).replace(/[\,]/g,'');
          break;
          case 'ok':
          countDownTime = moment(endAt).valueOf() - moment().valueOf();
          remainStr = shortEnglishHumanizer(endAt.diff(now)).replace(/[\,]/g,'');
          break;
          case 'fail':
          countDownTime = moment(finishAt).valueOf();
          remainStr = shortEnglishHumanizer(finishAt.diff(now)).replace(/[\,]/g,'');
          break;
          default:
        }

        return(
          e.comingSoon==true?(
              <div className="pin coming-soon" key={i}>
                <div className="info-holder">
                <div className="text-holder">
                <h3>COMING SOON</h3>
                <p>即将上线...</p>
                </div>
                </div>
              </div>
            ):(
            <div className={`pin${(j==0&&i==0)?' special':''}`} key={i}>
            <div className="info-holder">
            <div className="top-holder">
              <img src={e.adds_logo||logo_demo} width={100} height={100} />

              <h3 className="title"><span className="main-title-large"
                 style={
                  {
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                  }
                }
              >{e.name}</span><span className="span-status">
              {e.status == 'ok'? (
                <p className="status-label ok">[ <Translate content="EIO.ok" />... ]</p>
              ):(
                (e.status == 'pre')? (
                  <p className="status-label pre">[ <Translate content="EIO.pre" /> ]</p>
                ):(
                  e.status == 'finish'? (
                    <p className="status-label finish">[ <Translate content="EIO.finish" /> ]</p>
                  ):(
                    <p className="status-label finish">[ <Translate content="EIO.pause" /> ]</p>
                  )
                )
              )}
              </span></h3>
              
              {((j%2==0&&i%4==0)||(j%2==1&&i%4==2))?(
                <div>
                <h4 className="adds_keyword" style={
                  {
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }
                }>{e.adds_keyword}</h4>
                <p className="proj-desc" style={
                  {
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }
                }>{e.adds_advantage}</p>
                </div>
              ):(
                // <div className={`keyword-holder ${e.status}`}>
                <h4 className="adds_keyword" style={
                  {
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }
                }>{e.adds_keyword}</h4>
                // </div>
              )}
              </div>
              <div className="bottom-holder">
              <Link to={`/eto/detail/${e.id}`}>
              <div className={`button primery-button ${e.status}`}>
                {e.status == 'ok'? (
                  <Translate content="EIO.Join_in_ETO" />
                ):(
                  (e.status == 'pre')? (
                    <Translate content="EIO.Reserve_ETO" />
                  ):(
                    e.status == 'finish'? (
                      <Translate content="EIO.Details" />
                    ):(
                      <Translate content="EIO.Details" />
                    )
                  )
                )}
                
              
              </div>
              </Link>
              <div className="percent-holder-out">
                <div className="percent-holder">
                  <div className="info-item">
                  <div className="percent-holder-in">
                    <div className="percent">
                      <div className={`percent-in ${e.status}`} style={{width: showPercent}}></div>
                      {/* <div className="info-text" style={{left: `${percent}%`}}>{`${percent}%`}</div> */}
                    </div>
                    <div className="info-text" style={{left: showPercent}}>{`${percent}%`}</div>
                  </div>
                  </div>
                </div>
                {((j%2==0&&i%4==0)||(j%2==1&&i%4==2))?(
                  // <p className="raised"><Translate content="EIO.Raised" />: {e.current_base_token_count} {e.base_token_name}</p>
                  <p className="raised">当前完成认购: {e.current_base_token_count} {e.base_token_name}</p>
                ):null}
                <p className={`raised ${e.status}`}><Icon name="time" />
                {e.status == 'ok'? (
                  <span className={`sub-time ${e.status}`}> 剩余 </span>
                ):(
                  (e.status == 'pre')? (
                    <span className={`sub-time ${e.status}`}> 距离开始 </span>
                  ):(
                    e.status == 'finish'? (
                      <span className={`sub-time ${e.status}`}> 完成时间 </span>
                    ):(
                      <span className={`sub-time ${e.status}`}> 完成时间 </span>
                    )
                  )
                )}
                <span>{remainStr}</span>
                
                </p>
                
                </div>
              </div>
              </div>
            </div>
          )
        )
      })}
      </div>
        )
      })}
      </div>
        <div className="btn-coming-soon" style={{display: this.state.showMore}} onClick={this.addMore.bind(this)}>加载更多</div>
      </div>
    );
  }
}

export default connect(EO,{
  listenTo() {
    return [AccountStore];
  },
  getProps(props) {
    return {
      myAccounts: AccountStore.getMyAccounts(),
      accountsWithAuthState: AccountStore.getMyAccountsWithAuthState(),
      isMyAccount: AccountStore.getState()
    }
  }
})
// export default EO;
