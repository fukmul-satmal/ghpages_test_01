'use strict';

const crypto = require("crypto");
const APP_PATH = '/ghpages_test_01'; // https://ユーザー名.github.io/<ココ> or ルートパス利用なら`/`だけでOK

let webAuth0 = null;
let accessToken = null;
let idToken = null;
let userInfo = null;
let expiresAt = 0;
let config = null;

const fetchAuthConfig = () => fetch("auth_config.json"); // auth_config.json読み込み

const configureClient = async () => {
  const response = await fetchAuthConfig();
  config = await response.json();

  webAuth0 = new auth0.WebAuth({
    domain: config.domain,
    clientID: config.clientId
  });
};

const isAuthenticated = () => {
    // Check whether the current time is past the
    // access token's expiry time
    console.log("isAuthenticated do,");
    return new Date().getTime() < expiresAt;
};

const getRndStr = () => {
  //使用文字の定義
  var str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+";
 
  //桁数の定義
  var len = 48;
 
  //ランダムな文字列の生成
  var result = "";
  for(var i=0;i<len;i++){
    result += str.charAt(Math.floor(Math.random() * str.length));
  }
  return result;
}


window.onload = async () => {

  let verifier = window.sessionStorage.getItem("verifier");
  if (!verifier) {
    let baseStr = getRndStr();
    console.log(baseStr);
    verifier = base64URLEncode(baseStr);
    window.sessionStorage.setItem("verifier", verifier);
  }
  document.getElementById("verifier").value = verifier;

  await configureClient();

  await handleAuthentication();

  let authFlg = isAuthenticated();

  if (authFlg) {
    console.log("is Auth.")
    // show the gated content
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {

    // Process the login state
    await handleRedirect();

    // Use replaceState to redirect the user away and remove the querystring parameters
    console.log("history replacestate.");
    window.history.replaceState({}, document.title, APP_PATH);
  }
};

const login = async () => {
  let user = document.getElementById("user").value;
  let pass = document.getElementById("pass").value;
  let realm = document.getElementById("realm").value;
  let nonce = document.getElementById("nonce").value;
  let code = document.getElementById("code").value;
  let verifier = document.getElementById("verifier").value;

  console.log("user is ; " + user);
  console.log("pass is ; " + pass);
  console.log("realm is ; " + realm);
  console.log("nonce is ; " + nonce);
  console.log("code is ; " + code);
  console.log("verifier is ; " + verifier);

  let challenge = "";
  if(!verifier) {
    alert("verifier is empty.");
    return;
  }
  else {
    challenge = base64URLEncode(await sha256(verifier));
  }

  if (!code) {
    console.log("challenge is " + challenge);
    console.log(challenge.length);
//    webAuth0.authorize({
//      redirectUri: window.location.origin + APP_PATH,
//      responseType: 'token id_token code',
//      scope: 'openid',
//      code_challenge: challenge,
//      code_challenge_method: 'S256'
//    });

  }
  else {
    document.codepost.code.value = code;
    document.codepost.code_verifier.value = verifier;
    document.codepost.client_id.value = config.clientId;
    document.codepost.redirect_uri.value = window.location.origin + APP_PATH;

    console.log("hidden code is " + document.codepost.code.value);
    console.log("hidden code_verifier is " + document.codepost.code_verifier.value);
    console.log("hidden client_id is " + document.codepost.client_id.value);
    console.log("hidden grant_type is " + document.codepost.grant_type.value);
    console.log("hidden redirect_uri is " + document.codepost.redirect_uri.value);

    let bodydata = {};
    bodydata["code"] = document.codepost.code.value;
    bodydata["code_verifier"] = document.codepost.code_verifier.value;
    bodydata["grant_type"] = document.codepost.grant_type.value;
    bodydata["client_id"] = document.codepost.client_id.value;
    bodydata["redirect_uri"] = document.codepost.redirect_uri.value;

    let sendForm = new FormData(document.getElementById('codepost_id'));

    fetch("https://fukmul-satmal.auth0.com/oauth/token", {
        method: "POST",
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bodydata)
    })
    .then((response) => {
        return response.json();
    })
    .then((resJson) => {
        console.log(JSON.stringify(resJson));
    })
    .catch((error) => {
        console.log("Error!");
        console.error(error);
    });
  }

};


const base64URLEncode = (str) => {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}


const sha256 = async (buffer) => {
//    let hashbuffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(buffer));
//    let hasharray = Array.from(new Uint8Array(hashbuffer));
//    let hashHex = hasharray.map(b => b.toString(16).padStart(2, '0')).join('');
//    console.log("hashHex is " + hashHex);
//    return hashHex;
    return crypto.createHash('sha256').update(buffer).digest();
}


const logout = () => {
    // Remove tokens and expiry time
    accessToken = null;
    idToken = null;
    userInfo = null;
    expiresAt = 0;

    // Remove isLoggedIn flag from localStorage
//    localStorage.removeItem('isLoggedIn');

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, APP_PATH);

  webAuth0.logout({
    returnTo: window.location.origin + APP_PATH
  });
};

//getTokenSilently
const renewSession = () => {
    console.log("renewSession do.");
    webAuth0.checkSession({}, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        webAuth0.client.userInfo(authResult.accessToken, (err, user) => {
          if (err) {
            console.log(err);
            alert(`Error: ${err.error}. Check the console for further details.`);
          }
          else if (user) {
            console.log("userinfo get.")
            setSession(authResult);
          }
          updateUI();
        });
      }
      else {
        if (err) {
          console.log(err);
          alert(`Could not get a new token (${err.error}: ${err.error_description}).`);
        }
        updateUI();
      }
    });
 };

//
const  handleAuthentication = () => {
    console.log("handleAuthentication do.");
    webAuth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        console.log("do set session");
        webAuth0.client.userInfo(authResult.accessToken, (err, user) => {
          if (err) {
            console.log(err);
            alert(`Error: ${err.error}. Check the console for further details.`);
          }
          else if (user) {
            console.log("userinfo get.")
            setSession(authResult, user);
          }
          updateUI();
        });
      }
      else {
        if (err) {
          console.log(err);
          alert(`Error: ${err.error}. Check the console for further details.`);
        }
        else {
          console.log(JSON.stringify(
            authResult
          ));
          console.log("try login.");
        }
        updateUI();
      }
    });
};

//handleRedirectCallback
const  handleRedirect = () => {
    console.log("handleRedirect do.");
    webAuth0.parseHash({hash: window.location.hash}, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        webAuth0.client.userInfo(authResult.accessToken, (err, user) => {
          if (err) {
            console.log(err);
            alert(`Error: ${err.error}. Check the console for further details.`);
          }
          else if (user) {
            console.log("userinfo get.")
            setSession(authResult, user);
          }
          updateUI();
        });
      }
      else {
        if (err) {
          console.log(err);
          alert(`Error: ${err.error}. Check the console for further details.`);
          logout();
        }
        updateUI();
      }
    });
};

const  setSession = (authResult, user) => {
    // Set isLoggedIn flag in localStorage
//    localStorage.setItem('isLoggedIn', 'true');

    console.log("setSession do.");
    // Set the time that the access token will expire at
    accessToken = authResult.accessToken;
    idToken = authResult.idToken;
    userInfo = user;
    expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();;
};

const  getAccessToken = () => {
    return accessToken;
};

const  getIdToken = () => {
    return idToken;
};

const getUser = () => {
    return userInfo;
};

const updateUI = () => { 
  console.log("updateUI do.");

  let authFlg = isAuthenticated();

  // NEW - add logic to show/hide gated content after authentication
  if (authFlg) {
    console.log("is Auth 2.");
    document.getElementById("gated-content").classList.remove("hidden");

    document.getElementById(
      "ipt-access-token"
    ).innerHTML = getAccessToken();

    document.getElementById("ipt-user-profile").innerHTML = JSON.stringify(
      getUser()
    );

    //プロフ画像
    const profile = getUser();
    document.getElementById("ipt-user-profile-image").src = profile.picture;

  } else {
    console.log("is not Auth.");
    document.getElementById("gated-content").classList.add("hidden");
  }
};

