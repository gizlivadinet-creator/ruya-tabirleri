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



let content="";



$("article, .content, .entry-content, .detail").each((i,el)=>{


content +=
" "+
$(el).text();



});



content =
temizle(content);



if(!content){

content =
temizle(
$("body").text()
);

}



return {

title:
title || "Rüya Tabiri",

content,
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
