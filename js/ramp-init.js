let currency = 'ETH';

$(document).ready(function () {
  addRampClickListener();
  setCurrency();
});

const addRampClickListener = () => {
  $("#ramp-btn").click(function(){
      rampClickListener()
  });
};

const rampClickListener = () => {
  console.log("Selected currency: ", currency);
  new rampInstantSdk.RampInstantSDK({
    hostAppName: "Unifty",
    hostLogoUrl: "https://unifty.io/assets/img/unifty2.png",
    swapAsset: currency,
    //url: 'https://ri-widget-staging.firebaseapp.com/', //remove this for the official release
    hostApiKey: 'qohqhya4v3he5d7k3pdcbuahek3apweoemv7m92h',
    variant: 'auto'
  })
    .on("*", (event) => console.log(event))
    .show();
};

const setCurrency = () => {
    currency = getCurrency();
    
    if(currency != "xDai" && currency != "CELO" && currency != "MATIC" && currency != "ETH"){
      currency = "ETH";
    }
}