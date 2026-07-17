import fs from "fs";
import * as cheerio from "cheerio";


const USER_AGENT = "ruya-yorumlari-rss/1.0";


const SITE_URL =
"https://www.diyadinnet.com/Ruya-Tabirleri";


const RSS_URL =
"https://gizlivadinet-creator.github.io/tarihte-bugun/ruya-tabirleri.xml";



function temizle(text = "") {

return text
.replace(/\s+/g, " ")
.trim();

}



async function sayfaCek(url) {

const response = await fetch(url,{
headers:{
"User-Agent":USER_AGENT
}
});


if(!response.ok){

throw new Error(`HTTP ${response.status}`);

}


return await response.text();

}





async function ruyaLinkleriAl(){


const html =
await sayfaCek(SITE_URL);


const $ =
cheerio.load(html);


let liste = [];



$("a").each((i,el)=>{


let baslik =
temizle($(el).text());


let link =
$(el).attr("href");



if(!baslik || !link){

return;

}



let kontrol =
(baslik + " " + link).toLowerCase();



// Sadece rüya içerikleri

if(

!kontrol.includes("ruya") &&

!kontrol.includes("rüya")

){

return;

}




// Yasaklar

const yasaklar=[

"kunye",
"künye",
"iletisim",
"iletişim",
"gizlilik",
"çerez",
"haber",
"video",
"galeri",
"fotoğraf"

];



if(
yasaklar.some(x =>
kontrol.includes(x)
)
){

return;

}



if(link.startsWith("/")){

link =
"https://www.diyadinnet.com"+link;

}



if(
!liste.some(x=>x.url===link)
){

liste.push({

title:baslik,

url:link

});

}



});



return liste;

}









async function ruyaDetayCek(url){


try{


const html =
await sayfaCek(url);


const $ =
cheerio.load(html);



let title =
temizle(
$("h1").first().text()
);



let image="";



$("img").each((i,el)=>{


if(!image){


let src =
$(el).attr("src") ||
$(el).attr("data-src");



if(src){


if(src.startsWith("//")){

src="https:"+src;

}


if(src.startsWith("/")){

src =
"https://www.diyadinnet.com"+src;

}


image=src;

}


}

});






let content="";



$("article, main, .content, .detail, .entry-content")
.each((i,el)=>{


content +=
" "+$(el).text();


});



content =
temizle(content);





let video="";



$("iframe, video source")
.each((i,el)=>{


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

catch{


return {

title:"",

content:"",

image:"",

video:"",

url

};


}


}









async function main(){


try{


const now =
new Date();



const liste =
await ruyaLinkleriAl();



let items="";



for(const item of liste){


const detay =
await ruyaDetayCek(item.url);



if(!detay.content){

continue;

}



let aciklama="";



// Görsel başta

if(detay.image){

aciklama +=

`<img src="${detay.image}" /><br/><br/>`;

}



// Tam içerik

aciklama +=
detay.content;



// Video sonda

if(detay.video){

aciklama +=

`

<br/><br/>

Video:

<a href="${detay.video}">
İzle
</a>

`;

}






items += `

<item>


<title><![CDATA[
${detay.title}
]]></title>



<description><![CDATA[
${aciklama}
]]></description>



<content:encoded><![CDATA[
${aciklama}
]]></content:encoded>



<link>
${detay.url}
</link>



<guid isPermaLink="true">
${detay.url}
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



${detay.image ? `

<media:content

url="${detay.image}"

medium="image"/>

`:""}



</item>

`;



}








const rss =

`<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0"

xmlns:media="http://search.yahoo.com/mrss/"

xmlns:content="http://purl.org/rss/1.0/modules/content/"

xmlns:dc="http://purl.org/dc/elements/1.1/">



<channel>



<title>
Diyadinnet Rüya Yorumları
</title>



<link>
${SITE_URL}
</link>



<description>
Diyadinnet kaynaklı rüya yorumları
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

`✅ RSS hazır. ${liste.length} rüya bulundu`

);



}



catch(error){


console.error(
"❌ HATA:",
error
);


process.exit(1);

}


}




main();
