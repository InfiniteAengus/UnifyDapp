$(document).ready(function () {
  if (isMacintosh()) {
    $("body").addClass("defaultPointer");
  }

  removingShopButton()
});

//Script used for giving a starting theme to the page
if (
  localStorage.getItem("pageTheme") === "light" ||
  localStorage.getItem("pageTheme") === null
) {
  document.body.classList.add("light-edition");
  localStorage.setItem("pageTheme", "light");
} else {
  document.body.classList.add("dark-edition");
  localStorage.setItem("pageTheme", "dark");
}

function isMacintosh() {
  return navigator.platform.indexOf("Mac") > -1;
}

function removingShopButton(){
  let url = window.location
  
  if(url.href.indexOf("rinkeby") != -1 || url.href.indexOf("celo") != -1 || url.href.indexOf("matic") != -1){
    let $elements = $(".footer li.shop:visible");
  
    $elements.css("display", "none");
  }
}