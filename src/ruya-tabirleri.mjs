import fs from "fs";
import * as cheerio from "cheerio";


const USER_AGENT = "ruya-tabirleri-rss/1.0";


const SITE_URL =
"https://www.diyadinnet.com/Ruya-Tabirleri";


const RSS_URL =
"https://gizlivadinet-creator.github.io/tarihte-bugun/ruya-tabirleri.xml";



function temizle(text=""){

return text
.replace(/\s+/g," ")
.trim();

}



async function sayfaCek(url){

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





async function ruyaListesi(){


const html =
await sayfaCek(SITE_URL);


const $ =
cheerio.load(html);


let liste=[];



$("a").each((i,el)=>{


let title =
temizle($(el).text());


let href =
$(el).attr("href");



if(!href) return;



if(
title.length < 3
) return;



// Menü ve gereksiz alanları çıkar

const yasak=[

"Künye",
"İletişim",
"Çerez",
"Gizlilik",
"Haber",
"Galeri",
"Video",
"Fotoğraf"

];


if(
yasak.some(x=>title.includes(x))
){

return;

}



if(
href.includes("ruya") ||
href.includes("ruyada") ||
href.includes("ruyasi")
){


if(
href.startsWith("/")
){

href =
"https://www.diyadinnet.com"+href;

}


liste.push({

title,
url:href

});


}



});



return liste;

}







async function ruyaDetay(url){


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



// İlk görsel

$("img").each((i,el)=>{


if(!image){


let src =
$(el).attr("src") ||
$(el).attr("data-src");



if(src){


if(src.startsWith("//")){

src="https:"+src;

}


else if(src.startsWith("/")){

src=
"https://www.diyadinnet.com"+src;

}


image=src;


}


}


});






let content="";



// Tam içerik alanları

$("article, .content, .entry-content, .detail, main")
.each((i,el)=>{


content +=
" "+$(el).text();


});



content =
temizle(content);






let video="";



// Video bul

$("video source, iframe")
.each((i,el)=>{


if(!video){


let src =
$(el).attr("src");


if(src){

video=src;

}


}


});





return {

title:
title || "Rüya Tabiri",

content,

image,

video,

url


};



}

catch(error){


console.log(
"Detay alınamadı:",
url
);


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
await ruyaListesi();



let items="";



for(const item of liste){


const detay =
await ruyaDetay(item.url);



if(!detay.content){

continue;

}



let aciklama = "";



// Görsel başa

if(detay.image){

aciklama +=

`<img src="${detay.image}" /><br/><br/>`;

}



// Tam içerik

aciklama += detay.content;



// Video sona

if(detay.video){


aciklama +=

`

<br/><br/>

<video controls>

<source src="${detay.video}">

</video>

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



<link>
${detay.url}
</link>



<guid>
${detay.url}
</guid>



<category>
Rüya Tabirleri
</category>



<dc:creator>
Diyadinnet
</dc:creator>



<pubDate>
${now.toUTCString()}
</pubDate>



${detay.image ?

`

<media:content

url="${detay.image}"

medium="image"/>

`

:""}



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
Diyadinnet Rüya Tabirleri
</title>


<link>
${SITE_URL}
</link>


<description>
Güncel rüya tabirleri ve anlamları
</description>


<language>
tr-TR
</language>


<atom:link
href="${RSS_URL}"
rel="self"
type="application/rss+xml"/>


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

`✅ RSS oluşturuldu. ${liste.length} rüya bulundu`

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
