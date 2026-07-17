import fs from "fs";

const USER_AGENT = "ruya-tabirleri-rss/1.0";

const SITE = "https://www.diyadinnet.com";

const RSS_URL =
"https://gizlivadinet-creator.github.io/tarihte-bugun/ruya-tabirleri.xml";



function cdata(text=""){

return text
.replace(/]]>/g,"]]]]><![CDATA[>");

}



function temizle(html=""){

return html

.replace(/<script[\s\S]*?<\/script>/gi,"")
.replace(/<style[\s\S]*?<\/style>/gi,"")
.replace(/<nav[\s\S]*?<\/nav>/gi,"")
.replace(/<header[\s\S]*?<\/header>/gi,"")
.replace(/<footer[\s\S]*?<\/footer>/gi,"")
.replace(/<form[\s\S]*?<\/form>/gi,"")

.replace(
/<img[^>]*(logo|d\/logo|logo\.svg)[^>]*>/gi,
""
)

.trim();

}




async function sayfaAl(url){

try{


const res =
await fetch(url,{
headers:{
"User-Agent":USER_AGENT
}
});


const html =
await res.text();



let baslik =
html.match(
/<h1[^>]*>([\s\S]*?)<\/h1>/i
)?.[1]
||
"";


baslik =
baslik
.replace(/<[^>]+>/g,"")
.replace(/\s+/g," ")
.trim();



let icerik =

html.match(
/<article[^>]*>([\s\S]*?)<\/article>/i
)?.[1]

||

html.match(
/<div[^>]+class=["'][^"']*(article|content|detail)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
)?.[2]

||

"";



icerik =
temizle(icerik);



if(
icerik.length < 300
)
return null;



let resim="";


const img =
icerik.match(
/<img[^>]+src=["']([^"']+)["']/i
);


if(img){

resim =
img[1].startsWith("http")
?
img[1]
:
SITE + img[1];

}



let video="";


const iframe =
icerik.match(
/<iframe[^>]+src=["']([^"']+)["']/i
);


if(iframe){

video=iframe[1];

}



// içerikteki medya tekrarlarını kaldır

icerik =
icerik.replace(
/<img[^>]*>/gi,
""
);


icerik =
icerik.replace(
/<iframe[\s\S]*?<\/iframe>/gi,
""
);



return {

baslik,
icerik,
resim,
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


const ana =
await fetch(
SITE+"/Ruya-Tabirleri",
{
headers:{
"User-Agent":USER_AGENT
}
});


const html =
await ana.text();



const linkler =

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



const urls =
[...new Set(linkler)];



let items="";

let adet=0;



for(const url of urls){


const veri =
await sayfaAl(url);



if(!veri)
continue;



if(
!veri.url.includes("ruyada-")
)
continue;



let makale="";



// görsel en başta

if(veri.resim){

makale +=

`<img src="${veri.resim}" /><br/><br/>`;

}



// tam içerik

makale += veri.icerik;



// video en sonda

if(veri.video){

makale +=

`<br/><br/>
<iframe src="${veri.video}">
</iframe>`;

}



items += `

<item>

<title><![CDATA[
${cdata(veri.baslik)}
]]></title>


<description><![CDATA[
${cdata(veri.icerik.substring(0,1000))}
]]></description>


<content:encoded><![CDATA[
${cdata(makale)}
]]></content:encoded>


<link>
${veri.url}
</link>


<guid>
${veri.url}
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


${
veri.resim
?
`
<media:content 
url="${veri.resim}"
medium="image"/>
`
:
""
}


</item>

`;



adet++;



if(adet>=100)
break;


}





const rss =

`<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0"

xmlns:atom="http://www.w3.org/2005/Atom"

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
Rüya Yorumları ve anlamları
</description>


<language>
tr-TR
</language>


<atom:link 
href="${RSS_URL}"
rel="self"
type="application/rss+xml"/>


<lastBuildDate>
${new Date().toUTCString()}
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
"✅ RSS oluşturuldu:",
adet
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
