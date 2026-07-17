import fs from "fs";

const USER_AGENT = "ruya-tabirleri-rss/1.0";

const SITE = "https://www.diyadinnet.com";

const RSS_URL =
"https://gizlivadinet-creator.github.io/tarihte-bugun/ruya-tabirleri.xml";


function xmlTemizle(text="") {

return text
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;");

}



function temizHTML(html="") {

return html

.replace(/<script[\s\S]*?<\/script>/gi,"")
.replace(/<style[\s\S]*?<\/style>/gi,"")
.replace(/<nav[\s\S]*?<\/nav>/gi,"")
.replace(/<header[\s\S]*?<\/header>/gi,"")
.replace(/<footer[\s\S]*?<\/footer>/gi,"")
.replace(/<form[\s\S]*?<\/form>/gi,"")

.replace(/cookieChoices[\s\S]*?;/gi,"")

.replace(
/<img[^>]+(logo|d\/logo|logo\.svg)[^>]*>/gi,
""
)

.trim();

}



async function sayfaCek(url){

try{


const response =
await fetch(url,{
headers:{
"User-Agent":USER_AGENT
}
});


const html =
await response.text();



let title =
html.match(
/<h1[^>]*>([\s\S]*?)<\/h1>/i
)?.[1]
||
html.match(
/<title>(.*?)<\/title>/i
)?.[1]
||
"";


title =
title
.replace(/<[^>]+>/g,"")
.trim();



let content =
html.match(
/<article[^>]*>([\s\S]*?)<\/article>/i
)?.[1]
||
html.match(
/<div[^>]+class=["'][^"']*(content|detail|haber-detay)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
)?.[2]
||
"";



content =
temizHTML(content);



if(!content || content.length < 300){

return null;

}



let image="";

const img =
content.match(
/<img[^>]+src=["']([^"']+)["']/i
);


if(img){

image =
img[1].startsWith("http")
?
img[1]
:
SITE + img[1];

}



let video="";

const iframe =
content.match(
/<iframe[^>]+src=["']([^"']+)["']/i
);


if(iframe){

video = iframe[1];

}



// resimleri içerikten kaldır
content =
content.replace(
/<img[^>]*>/gi,
""
);



// videoları içerikten kaldır
content =
content.replace(
/<iframe[\s\S]*?<\/iframe>/gi,
""
);



return {

title,
content,
image,
video,
url

};


}
catch{

return null;

}

}




async function main(){


try{


const response =
await fetch(
SITE + "/Ruya-Tabirleri",
{
headers:{
"User-Agent":USER_AGENT
}
});


const html =
await response.text();



const urls =
[
...html.matchAll(
/href=["']([^"']*ruyada-[^"']*)["']/gi
)
]
.map(x=>x[1])
.map(x=>
x.startsWith("http")
?
x
:
SITE+x
);



const liste =
[
...new Set(urls)
];



let items="";

let count=0;



for(const url of liste){


const data =
await sayfaCek(url);



if(!data)
continue;



if(
!data.url.includes("ruyada-")
)
continue;



let fullContent = "";



// Görsel ilk sırada

if(data.image){

fullContent +=
`
<img src="${data.image}" />

<br/><br/>
`;

}



// Tam makale

fullContent += data.content;



// Video en son

if(data.video){

fullContent +=
`

<br/><br/>

<iframe src="${data.video}">
</iframe>

`;

}




items += `

<item>

<title><![CDATA[
${data.title}
]]></title>


<description><![CDATA[
${data.content.substring(0,500)}
]]></description>


<content:encoded><![CDATA[
${fullContent}
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
${new Date().toUTCString()}
</pubDate>


${data.image ?
`
<media:content 
url="${data.image}"
medium="image"/>
`
:
""}


</item>

`;



count++;


if(count>=100)
break;


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
${SITE}/Ruya-Tabirleri
</link>


<description>
Diyadinnet Rüya Yorumları
</description>


<language>
tr-TR
</language>


<atom:link 
href="${RSS_URL}"
rel="self"
type="application/rss+xml"/>


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
count
);


}
catch(error){

console.error(
"❌ Hata:",
error
);

process.exit(1);

}


}


main();
