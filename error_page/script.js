'use strict';


window.onload = async () => {
  
  // NEW - add logic to show/hide gated content after authentication
//  if (isAuthenticated) {
//    document.getElementById("gated-content").classList.remove("hidden");

  var qry = {};
  var qrystr = window.location.href;
  if (qrystr) {
    var qrystrarry = qrystr.split('?');
    if (Array.isArray(qrystrarry)) {
      qrystr = qrystrarry[1];
      qrystr.split('&').forEach(function(qrystr) {
        var qryarry = qrystr.split('=');
        qry[qryarry[0]] = qryarry[1];
      });

      if (qry.error) {
        document.getElementById("ipt-error").innerHTML = qry.error;
      }

      if (qry.error_description) {
        document.getElementById("ipt-error_description").innerHTML = qry.error_description;
      }

      if (qry.error_trucking) {
        document.getElementById("ipt-tracking_id").innerHTML = qry.tracking;
      }
    }
  }
};
