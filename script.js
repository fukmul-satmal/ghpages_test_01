'use strict';

const APP_PATH = '/'; // https://ユーザー名.github.io/<ココ> or ルートパス利用なら`/`だけでOK
let webAuth0 = null;
let accessToken = null;
let idToken = null;
let userInfo = null;
let expiresAt = 0;

const fetchAuthConfig = () => fetch("auth_config.json"); // auth_config.json読み込み

const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  webAuth0 = new auth0.WebAuth({
    domain: config.domain,
    clientID: config.clientId
  });
};

window.onload = async () => {
  await configureClient();

  updateUI();

  const isAuthenticated = isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {

    // Process the login state
    handleRedirect();
    
    updateUI();

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, APP_PATH);
  }
};

const updateUI = async () => { 

  handleAuthentication();
  const isAuthenticated = isAuthenticated();

  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-login").disabled = isAuthenticated;
  
  // NEW - add logic to show/hide gated content after authentication
  if (isAuthenticated) {
    document.getElementById("gated-content").classList.remove("hidden");

    document.getElementById(
      "ipt-access-token"
    ).innerHTML = getAccessToken();

    document.getElementById("ipt-user-profile").innerHTML = JSON.stringify(
      getIdToken()
    );

    //プロフ画像
    const profile = getUser();
    document.getElementById("ipt-user-profile-image").src = profile.picture;

  } else {
    document.getElementById("gated-content").classList.add("hidden");
  }
};

const login = async () => {
  let user = document.getElementById("user").value;
  let pass = document.getElementById("pass").value;
  let realm = document.getElementById("realm").value;
  let nonce = document.getElementById("nonce").value;

  console.log("user is ; " + user);
  console.log("pass is ; " + pass);
  console.log("realm is ; " + realm);
  console.log("nonce is ; " + nonce);

  webAuth0.authorize({
    redirectUri: window.location.origin + APP_PATH,
    responseType: 'token id_token',
    scope: 'openid'
  });
};

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

const isAuthenticated = () => {
    // Check whether the current time is past the
    // access token's expiry time
    return new Date().getTime() < expiresAt;
};

//getTokenSilently
const renewSession = () => {
    webAuth0.checkSession({}, (err, authResult) => {
       if (authResult && authResult.accessToken && authResult.idToken) {
         this.setSession(authResult);
       } else if (err) {
         console.log(err);
         alert(`Could not get a new token (${err.error}: ${err.error_description}).`);
       }
    });
 };

//
const  handleAuthentication = () => {
    webAuth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        setSession(authResult);
      }
    });
};

//handleRedirectCallback
const  handleRedirect = () => {
    webAuth0.parseHash({hash: window.location.hash}, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        setSession(authResult);
      } else if (err) {
        console.log(err);
        alert(`Error: ${err.error}. Check the console for further details.`);
        logout();
      }
    });
};

const  setSession = (authResult) => {
    // Set isLoggedIn flag in localStorage
//    localStorage.setItem('isLoggedIn', 'true');

    // Set the time that the access token will expire at
    accessToken = authResult.accessToken;
    idToken = authResult.idToken;
    expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();;
    webAuth0.client.userInfo(authResult.accessToken, (err, user) => {
      if (err) {
        console.log(err);
        alert(`Error: ${err.error}. Check the console for further details.`);
      }
      else if (user) {
        userInfo = user;
      }
    });
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

