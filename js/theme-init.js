"use strict";
(function(){
  var theme="light";
  try {
    var saved=localStorage.getItem("smc-theme");
    if (saved === "dark" || saved === "light" || saved === "wood" || saved === "sage" || saved === "sakura") theme=saved;
  } catch(e) {}
  document.documentElement.setAttribute("data-theme",theme);
  var animations="on";
  try { if(localStorage.getItem("smc-theme-animations")==="off") animations="off"; } catch(e) {}
  document.documentElement.setAttribute("data-animations",animations);
})();
document.addEventListener("DOMContentLoaded",function(){var y=document.getElementById("sfYear");if(y)y.textContent=new Date().getFullYear();});
