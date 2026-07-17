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







// SADECE RÜYA YORUMU BUL

async function ruyaLinkleriAl(){


const html =
await sayfaCek(SITE_URL);


const $ =
cheerio.load(html);


let liste=[];



$("a").each((i,el)=>{


const title =
temizle($(el).text());


let href =
$(el).attr("href");



if(!href || !title){

return;

}



// SADECE BU İZİN VERİLİ

const kontrol =
title.toLowerCase();



if(
!kontrol.includes("rüya yorumu") &&
!kontrol.includes("ruya yorumu")
){

return;

}



// TAM URL

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


if(src.startsWith("/")){

src =
"https://www.diyadinnet.com"+src;

}


image=src;

}


}


});





let content="";



// TAM İÇERİK

$("article,main,.content,.detail,.entry-content")
.each((i,el)=>{


content +=
" "+$(el).text();


});



content =
temizle(content);






let video="";


// Video bul

$("iframe,video source")
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



// Görsel başa

if(detay.image){

aciklama +=

`<img src="${detay.image}" /><br/><br/>`;

}



// Tam yazı

aciklama +=
detay.content;



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
Rüya Yorumu
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

xmlns:dc="http://purl.org/dc/elements/1.1/">



<channel>



<title>
Diyadinnet Rüya Yorumu
</title>



<link>
${SITE_URL}
</link>



<description>
Sadece Rüya Yorumu içerikleri
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

`✅ Sadece Rüya Yorumu RSS oluşturuldu. ${liste.length} içerik bulundu`

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
