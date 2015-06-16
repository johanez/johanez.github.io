// detect ie

if (navigator.userAgent.indexOf('MSIE') != -1)
 var detectIEregexp = /MSIE (\d+\.\d+);/ //test for MSIE x.x
else // if no "MSIE" string in userAgent
 var detectIEregexp = /Trident.*rv[ :]*(\d+\.\d+)/ //test for rv:x.x or rv x.x where Trident string exists

if (detectIEregexp.test(navigator.userAgent)){

}


var ieRegex = new RegExp("(MSIE |Trident/|Edge )");
if(detectIEregexp.test(navigator.userAgent)) console.log("IE");