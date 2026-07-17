import fs from "fs";

const USER_AGENT = "ruya-tabirleri-rss/1.0";

const SITE =
"https://www.diyadinnet.com";

const RSS_URL =
"https://gizlivadinet-creator.github.io/tarihte-bugun/ruya-tabirleri.xml";


function temizle(html="") {

return html
.replace(/<script[\s\S]*?<\/script>/gi,"")
.replace(/<style[\s\S]*?<\/style>/gi,"")
.replace(/<nav[\s\S]*?<\/nav>/gi,"")
.replace(/<header[\s\S]*?<\/header>/gi,"")
.replace(/<footer[\s\S]*?<\/footer>/gi,"")
.replace(/<form[\s\S]*?<\/form>/gi,"")
.replace(/cookieChoices[\s\S]*?;/gi,"")
.replace(/<img[^>]*logo[^>]*>/gi,"")
.replace(/<img[^>]*d\.svg[^>]*>/gi,"")
.trim();

}



function xml(text=""){

return text
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;");

}



async function cekSayfa(url){

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
html.match(/<title>(.*?)<\/title>/is)?.[1] || "";



baslik =
baslik
.replace(/Diyadinnet.*/i,"")
.trim();



let icerik =
html.match(
/<article[\s\S]*?<\/article>/i
)?.[0]
||
html.match(
/<main[\s\S]*?<\/main>/i
)?.[0]
||
"";



icerik =
temizle(icerik);



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
SITE+img[1];

}



let video="";


const vid =
icerik.match(
/<iframe[^>]+src=["']([^"']+)["']/i
);


if(vid){

video=vid[1];

}



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
[...html.matchAll(
/href=["']([^"']*ruyada-[^"']*)["']/gi
)]
.map(x=>x[1]);



const benzersiz =
[
...new Set(
linkler.map(x=>
x.startsWith("http")
?
x
:
SITE+x
)
)
];



let items="";


let sayac=0;



for(const link of benzersiz){


if(sayac>=100)
break;



const veri =
await cekSayfa(link);



if(!veri)
continue;



if(
!veri.baslik ||
!veri.icerik
)
continue;



if(
!veri.url.includes("ruyada-")
)
continue;



let icerik="";


// görsel en başta

if(veri.resim){

icerik +=
`<img src="${veri.resim}" /><br/><br/>`;

}


// içerik

icerik += veri.icerik;


// video en sonda

if(veri.video){

icerik +=
`<br/><br/><iframe src="${veri.video}"></iframe>`;

}



items += `

<item>

<title><![CDATA[
${veri.baslik}
]]></title>


<description><![CDATA[
${veri.icerik}
]]></description>


<content:encoded><![CDATA[
${icerik}
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



${veri.resim ?
`
<media:content 
url="${veri.resim}"
medium="image"/>
`
:
""}


</item>

`;



sayac++;


}



const rss = `<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0"

xmlns:content="http://purl.org/rss/1.0/modules/content/"

xmlns:media="http://search.yahoo.com/mrss/"

xmlns:dc="http://purl.org/dc/elements/1.1/">


<channel>


<title>
Diyadinnet Rüya Tabirleri
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


${items}


</channel>

</rss>`;



fs.writeFileSync(
"ruya-tabirleri.xml",
rss,
"utf8"
);



console.log(
"✅ Rüya RSS oluşturuldu:",
sayac
);



}
catch(e){

console.error(e);

process.exit(1);

}

}



main();
