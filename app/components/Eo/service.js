let isFlag = false;

export const fetchJson = (options) => {
  const { url, type, data, ...others } = options;

  isFlag = true;

  let opts = {
    ...others,
    method: type || "get",
    credentials: "include",
    headers: options.headers || {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
     
  };
  if(["POST","PUT"].indexOf(opts.method.toUpperCase()) >= 0){
        // let params = Object.keys(data).map(function (key) {
        //     return encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
        // }).join("&");
    opts.body =  JSON.stringify(data);
  }
  var newUrl = url;
  if(opts.method.toUpperCase() == "GET" && data){
    newUrl+="?";
    let params = Object.keys(data).map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
    }).join("&");
    newUrl+=params;
  }
  fetch(newUrl, opts)
        .then(resData => toJson(resData, opts))
        .catch(error => errorHandler(error,opts))
        .then(resData => resHandler(resData, opts))
        .catch(error => errorHandler(error, opts));
};

function toJson(resp, options) {
  return resp.json();
}
function resHandler(resData, options){
    console.log(resData)
  options.success(resData);
}
function errorHandler(error, options, status) {
  isFlag=false;
  if(options.error){
    options.error(error);
  }else{
    console.error(error);
  }
  return false;
}

export function fetchJsonList(offset, cb){
  fetchJson({
    url: `/api/cybex/projects?limit=4&offset=${offset}`,
    type: "GET",
    success: (data)=>{
      cb(data);
    }
  });
}

export function fetchBanner(cb){
    fetchJson({
      url: "/api/cybex/projects/banner",
      type: "GET",
      success: (data)=>{
        cb(data);
      }
    });
  }

export function fetchDetails(data, cb){
    fetchJson({
        url: "/api/cybex/project/detail",
        type: "GET",
        success: (res)=>{
            cb(res);
        },
        data:data
    });
}
export function fetchKYC(data, cb){
    fetchJson({
        url: "/api/cybex/user/check_status",
        type: "GET",
        success: (res)=>{
            cb(res);
        },
        data:data
    });

}

