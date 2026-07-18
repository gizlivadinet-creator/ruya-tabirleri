import fs from "fs";
import * as cheerio from "cheerio";


const USER_AGENT = "ruya-tabirleri-rss/1.0";


const ANA_URL =
"https://www.diyadinnet.com/Ruya-Tabirleri";


const RSS_URL =
"https://gizlivadinet-creator.github.io/ruya-tabirleri.xml";



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



function temizle(text=""){

return text
.replace(/\s+/g," ")
.trim();

}



function htmlTemizle(html=""){

// Script ve style etiketlerini kaldır
html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

// Gereksiz boşlukları sil
html = html.replace(/\s+/g, " ").trim();

return html;

}



async function ruyaLinkleriAl(){


const html =
await sayfaCek(ANA_URL);


const $ =
cheerio.load(html);


let links=[];



$("a").each((i,el)=>{


const title =
temizle($(el).text());


let href =
$(el).attr("href");



if(!href) return;



if(
title.length < 3
) return;



if(
title.includes("Künye") ||
title.includes("İletişim") ||
title.includes("Çerez") ||
title.includes("Gizlilik") ||
title.includes("Haber")
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


links.push({

title,
url:href

});


}



});



return links;

}



function extraHTML(html){

let content = "";

// h2 ve p kombinasyonları
const sections = html.match(/(<h2.*?<\/h2>.*?(?=<h2|<h3|<video|$))/gis) || [];

sections.forEach(section => {
  const h2Match = section.match(/<h2[^>]*>(.*?)<\/h2>/is);
  if(h2Match){
    content += `<h2>${h2Match[1]}</h2>`;
  }
  
  const paragraphs = section.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
  paragraphs.forEach(p => {
    content += p;
  });
});

// Eğer h2 yoksa, sadece h3 ve p kombinasyonları
if(!content){
  const h3Sections = html.match(/(<h3.*?<\/h3>.*?(?=<h3|<video|$))/gis) || [];
  
  h3Sections.forEach(section => {
    const h3Match = section.match(/<h3[^>]*>(.*?)<\/h3>/is);
    if(h3Match){
      content += `<h3>${h3Match[1]}</h3>`;
    }
    
    const paragraphs = section.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
    paragraphs.forEach(p => {
      content += p;
    });
  });
}

// Eğer yine yoksa, en azından p etiketlerini al
if(!content){
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
  paragraphs.forEach(p => {
    content += p;
  });
}

return temizle(content.replace(/<[^>]+>/g, ""));

}



async function ruyaDetayCek(url){


try{


const html =
await sayfaCek(url);

const htmlTemiz = htmlTemizle(html);

const $ =
cheerio.load(htmlTemiz);



let title =
temizle(
$("h1").first().text()
);



// Görsel al (ilk sırada)
let image = "";
const imgTag = $("img").first();
if(imgTag.length){
image = imgTag.attr("src") || "";
if(image && !image.startsWith("http")){
  if(image.startsWith("/")){
    image = "https://www.diyadinnet.com" + image;
  }
}
}



// Ana içerik (h2, p, h3 kombinasyonları)
let content="";

$("article, .content, .entry-content, .detail, main, .post, .post-content").each((i,el)=>{

const sectionHtml = $(el).html() || "";

// h2 ve p kombinasyonları
const h2Sections = sectionHtml.match(/(<h2[^>]*>.*?<\/h2>.*?(?=<h2|<h3|<video|$))/gis) || [];

if(h2Sections.length > 0){
  h2Sections.forEach(section => {
    const parsed = cheerio.load(section);
    const h2Text = temizle(parsed("h2").text());
    
    if(h2Text){
      content += `<h2>${h2Text}</h2>\n`;
    }
    
    const pTexts = [];
    parsed("p").each((_, pEl) => {
      const pText = temizle(parsed(pEl).text());
      if(pText && pText.length > 5){
        pTexts.push(`<p>${pText}</p>`);
      }
    });
    
    content += pTexts.join("\n");
  });
}

// Eğer h2 yoksa h3 ve p kombinasyonları
if(!h2Sections.length){
  const h3Sections = sectionHtml.match(/(<h3[^>]*>.*?<\/h3>.*?(?=<h3|<video|$))/gis) || [];
  
  h3Sections.forEach(section => {
    const parsed = cheerio.load(section);
    const h3Text = temizle(parsed("h3").text());
    
    if(h3Text){
      content += `<h3>${h3Text}</h3>\n`;
    }
    
    const pTexts = [];
    parsed("p").each((_, pEl) => {
      const pText = temizle(parsed(pEl).text());
      if(pText && pText.length > 5){
        pTexts.push(`<p>${pText}</p>`);
      }
    });
    
    content += pTexts.join("\n");
  });
}

// Eğer yine yoksa sadece p etiketleri
if(!h2Sections.length && !sectionHtml.includes("<h3")){
  const parsed = cheerio.load(sectionHtml);
  const pTexts = [];
  
  parsed("p").each((_, pEl) => {
    const pText = temizle(parsed(pEl).text());
    if(pText && pText.length > 5){
      pTexts.push(`<p>${pText}</p>`);
    }
  });
  
  content += pTexts.join("\n");
}

});



// Video (varsa en sonda)
let video = "";
const videoTag = $("video").first();
if(videoTag.length){
  const srcTag = videoTag.find("source").first();
  if(srcTag.length){
    video = srcTag.attr("src") || "";
    if(video && !video.startsWith("http")){
      if(video.startsWith("/")){
        video = "https://www.diyadinnet.com" + video;
      }
    }
  }
}



content = temizle(content);



if(!content){

content =
temizle(
$("body").text()
).substring(0, 500);

}



// Final HTML yapısı
let finalContent = "";

if(image){
finalContent += `<img src="${image}" alt="${title}" />\n\n`;
}

if(content){
finalContent += content;
}

if(video){
finalContent += `\n\n<video controls>\n<source src="${video}" />\n</video>`;
}



return {

title:
title || "Rüya Tabiri",

content: finalContent,
url

};



}

catch{


return {

title:"Rüya Tabiri",
content:"",
url

};


}


}




async function main(){


try{


const now =
new Date();



const links =
await ruyaLinkleriAl();



let items="";



for(const item of links){



const detay =
await ruyaDetayCek(item.url);



if(!detay.content) continue;



items += `

<item>


<title><![CDATA[
${detay.title}
]]></title>



<description><![CDATA[
${detay.content}
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



</item>

`;

}



const rss = `<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0"

xmlns:dc="http://purl.org/dc/elements/1.1/">


<channel>


<title>
Diyadinnet Rüya Tabirleri
</title>


<link>
${ANA_URL}
</link>


<description>
Diyadinnet rüya tabirleri tam içerik RSS
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
`✅ Rüya RSS oluşturuldu. ${links.length} içerik bulundu`
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
