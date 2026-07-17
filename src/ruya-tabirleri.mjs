import fs from "fs";
import * as cheerio from "cheerio";


const USER_AGENT = "ruya-rss/1.0";


const BASE =
"https://www.diyadinnet.com";


const START_URL =
"https://www.diyadinnet.com/Ruya-Tabirleri";



const RSS_URL =
"https://gizlivadinet-creator.github.io/tarihte-bugun/ruya-tabirleri.xml";





function temiz(text=""){

return text
.replace(/\s+/g," ")
.trim();

}






async function fetchHTML(url){

const res = await fetch(url,{
headers:{
"User-Agent":USER_AGENT
}
});


if(!res.ok){

throw new Error(res.status);

}


return await res.text();

}







async function linkleriBul(){


const html =
await fetchHTML(START_URL);


const $ =
cheerio.load(html);



let links=[];



$("a").each((i,el)=>{


let title =
temiz($(el).text());


let href =
$(el).attr("href");



if(!href || !title)
return;




if(href.startsWith("/")){

href =
BASE + href;

}




let kontrol =
href.toLowerCase();





// sadece gerçek rüya sayfaları

if(

kontrol.includes("ruyada") ||

kontrol.includes("ruya-")

){



// yasaklar

if(

kontrol.includes("ruya-tabirleri") ||

kontrol.includes("haber") ||

kontrol.includes("iletisim") ||

kontrol.includes("kunye")

){

return;

}



links.push({

title,

url:href

});

}


});





return [...new Map(
links.map(x=>[x.url,x])
).values()];

}









async function detay(url){


try{


const html =
await fetchHTML(url);


const $ =
cheerio.load(html);




// gereksizleri kaldır

$("script,style,nav,header,footer,iframe,.menu,.logo,.ads,.advert").remove();





let title =
temiz(
$("h1").first().text()
);





let image="";



// içerik içindeki ilk gerçek resim

$("article img,.content img,.detail img,img").each((i,el)=>{


if(image)
return;



let src =
$(el).attr("src") ||
$(el).attr("data-src");



if(!src)
return;



if(
src.includes("logo") ||
src.includes("icon")
){

return;

}




if(src.startsWith("/")){

src =
BASE+src;

}



image=src;



});






let content="";



// sadece yazı alanları

$("article,.detail,.entry-content,.content").each((i,el)=>{


content +=
" "+$(el).text();


});





content =
temiz(content);






// gereksiz başlangıç temizliği

content =
content
.replace(/ANA SAYFA.*?Rüya Tabirleri/gi,"")
.replace(/Trend Haberler.*$/gi,"")
.replace(/document\.addEventListener.*$/gi,"");







let video="";



$("video source, iframe").each((i,el)=>{


if(!video){

video =
$(el).attr("src") || "";

}


});





return {

title:
title || "Rüya Yorumu",

content,

image,

video,

url

};



}
catch(e){


return null;


}


}









async function main(){


const now =
new Date();



const links =
await linkleriBul();




let items="";



let sayac=0;



for(const link of links){


const data =
await detay(link.url);



if(!data)
continue;



if(data.content.length < 100)
continue;




let html="";



// görsel başta

if(data.image){


html +=

`<p><img src="${data.image}" /></p>`;

}





html += data.content;





// video en sonda

if(data.video){


html +=

`

<p>
Video:
<a href="${data.video}">
İzle
</a>
</p>

`;

}





items += `

<item>


<title><![CDATA[
${data.title}
]]></title>



<description><![CDATA[
${html}
]]></description>



<content:encoded><![CDATA[
${html}
]]></content:encoded>



<link>
${data.url}
</link>



<guid>
${data.url}
</guid>



<category>
Rüya Yorumları
</category>



<dc:creator>
Diyadinnet
</dc:creator>



<pubDate>
${now.toUTCString()}
</pubDate>



${data.image ?

`<media:content url="${data.image}" medium="image"/>`

:""}



</item>

`;



sayac++;



}





const rss =

`<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0"

xmlns:content="http://purl.org/rss/1.0/modules/content/"

xmlns:media="http://search.yahoo.com/mrss/"

xmlns:dc="http://purl.org/dc/elements/1.1/">


<channel>


<title>
Diyadinnet Rüya Yorumları
</title>


<link>
${START_URL}
</link>


<description>
Dini ve geleneksel rüya yorumları
</description>


<language>
tr-TR
</language>


<lastBuildDate>
${now.toUTCString()}
</lastBuildDate>


${items}


</channel>

</rss>`;






fs.writeFileSync(

"ruya-tabirleri.xml",

rss,

"utf8"

);



console.log(
"✅ RSS hazır:",
sayac,
"rüya"
);


}




main();
