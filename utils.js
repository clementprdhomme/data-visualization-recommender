/* Process an AJAX request to the url passed as argument and call the callback
 * if successful, otherwise store the error object inside the store. */
var $get = function (url, callback) {
  var xmlHttpRequest = new XMLHttpRequest();

  xmlHttpRequest.onreadystatechange = function() {
    if (xmlHttpRequest.readyState === 4 && xmlHttpRequest.status === 200) {
      var data = {};

      try {
        data = JSON.parse(xmlHttpRequest.responseText);
      } catch(err) {
        store.error = err;
        return;
      }

      callback.apply(null, [ data ]);
    }
  };

  xmlHttpRequest.open('GET', url, true);
  xmlHttpRequest.send();
};
