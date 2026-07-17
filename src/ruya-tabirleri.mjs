import fs from "fs";
import * as cheerio from "cheerio";


const USER_AGENT = "ruya-tabirleri-rss/1.0";


const SITE_URL =
"https://www.diyadinnet.com/Ruya-Tabirleri";


const RSS_URL =
"https://gizlivadinet-creator.github.io/tarihte-bugun/ruya-tabirleri.xml";



async function main(){

try{


const response = await fetch(SITE_URL,{
headers:{
"User-Agent":USER_AGENT
}
});


if(!response.ok){

throw new Error(`HTTP ${response.status}`);

}


const html = await response.text();


const $ = cheerio.load(html);



let items = "";



$("a").each((i,el)=>{


const title =
$(el).text().trim();


const href =
$(el).attr("href");



if(
title &&
href &&
title.length > 2
){


const link =
href.startsWith("http")
?
href
:
"https://www.diyadinnet.com"+href;



items += `

<item>

<title><![CDATA[
${title}
]]></title>


<description><![CDATA[
${title} rüya tabiri ve anlamı
]]></description>


<link>
${link}
</link>


<guid>
${link}
</guid>


<category>
Rüya Tabirleri
</category>


<dc:creator>
Diyadinnet
</dc:creator>


<pubDate>
${new Date().toUTCString()}
</pubDate>


</item>

`;

}


});



const rss = `<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0"

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


${items}


</channel>

</rss>`;



fs.writeFileSync(
"ruya-tabirleri.xml",
rss,
"utf8"
);



console.log("✅ Rüya RSS oluşturuldu");


}


catch(error){

console.error(error);

process.exit(1);

}


}


main();
