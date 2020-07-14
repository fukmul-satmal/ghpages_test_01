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
        document.getElementById("ipt-error").innerHTML = decodeURIComponent(qry.error);
      }

      if (qry.error_description) {
        document.getElementById("ipt-error_description").innerHTML = decodeURIComponent(qry.error_description);
      }

      console.log("tracking_id is " + qry.tracking);
      if (qry.tracking) {
        document.getElementById("ipt-tracking_id").innerHTML = decodeURIComponent(qry.tracking);
      }


      if(qry.client_id) {
        var clientId = qry.client_id;
        fetch("../link.json")
        .then(function(response) {
            return response.json();
        })
        .then(function(linkJson) {
          var clientLink = linkJson[clientId];
          if (!clientLink) {
            throw new Error('client id is unknown.');
          }
          else {
            var filename = "../" + clientLink + ".json";
            fetch(filename)
            .then(function(response) {
              if (response.ok) {
                return response.json();
              }
              //
              throw new Error("Target url not found.");
            })
            .then(function(urlJson) {
              console.log("urlJson.url is " + urlJson.url);
              document.getElementById("link_back").href = urlJson.url;
            })
            .catch(function(error) {
              console.error(error);
            });
          }
        })
        .catch(function(error) {
          console.error(error);
        });
      }


    }
  }
};
