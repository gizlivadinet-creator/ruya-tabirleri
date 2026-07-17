import fs from "fs";

const RSS_URL =
"https://gizlivadinet-creator.github.io/tarihte-bugun/ruya-tabirleri.xml";

const BASE =
"https://www.diyadinnet.com";

const USER_AGENT =
"ruya-tabirleri-rss/1.0";


function temiz(text="") {

return text
.replace(/<script[\s\S]*?<\/script>/gi,"")
.replace(/<style[\s\S]*?<\/style>/gi,"")
.replace(/<!--[\s\S]*?-->/g,"")
.trim();

}



function xml(text=""){

return text
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;");

}




async function sayfaCek(url){

const res = await fetch(url,{
headers:{
"User-Agent":USER_AGENT
}
});

return await res.text();

}




function baslikBul(html){

let m =
html.match(
/<h1[^>]*>(.*?)<\/h1>/is
);

return m ?
m[1].replace(/<[^>]+>/g,"").trim()
:
"Rüya Yorumu";

}




function gorselBul(html){

let m =
html.match(
/<img[^>]+src=["']([^"']+)["']/i
);

if(!m) return "";

if(m[1].startsWith("/"))
return BASE+m[1];

return m[1];

}




function makaleBul(html){


let m =
html.match(
/<div[^>]*class=["'][^"']*article-text[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i
);


if(!m)
return "";


let content=m[1];


// gereksizleri kaldır

content =
content
.replace(/<a[^>]*>/gi,"")
.replace(/<\/a>/gi,"")
.replace(/<svg[\s\S]*?<\/svg>/gi,"")
.replace(/<i[\s\S]*?<\/i>/gi,"")
.replace(/style="[^"]*"/gi,"")
.replace(/class="[^"]*"/gi,"");



// sadece izin verilen taglar

content =
content.replace(
/<(?!\/?(p|h2|h3|strong|br)\b)[^>]+>/gi,
""
);


return content.trim();

}




function videoBul(html){

let m =
html.match(
/<iframe[^>]+src=["']([^"']+)["']/i
);


if(!m)
return "";


return `
<br>
<h2>Video</h2>
<iframe src="${m[1]}" frameborder="0" allowfullscreen></iframe>
`;

}





async function rssOlustur(){


let liste = [

"https://www.diyadinnet.com/Ruya-Tabirleri"

];



let items="";


for(const url of liste){


let html =
await sayfaCek(url);



let linkler =
[
...html.matchAll(
/href=["']([^"']*ruyada-[^"']*)["']/gi
)
]
.map(x=>x[1])
.filter(
x=>x.startsWith("/")
)
.map(
x=>BASE+x
);



for(const link of [...new Set(linkler)]){


let sayfa =
await sayfaCek(link);



let baslik =
baslikBul(sayfa);



let resim =
gorselBul(sayfa);



let makale =
makaleBul(sayfa);



let video =
videoBul(sayfa);



items += `

<item>

<title><![CDATA[
${baslik}
]]></title>


<description><![CDATA[
${baslik}
]]></description>


<content:encoded><![CDATA[

${resim ?
`<img src="${resim}" />`
:""}


<h1>
${baslik}
</h1>


${makale}


${video}


]]></content:encoded>



<link>
${link}
</link>


<guid>
${link}
</guid>


<category>
Rüya Yorumları
</category>


<pubDate>
${new Date().toUTCString()}
</pubDate>


</item>

`;

}



}



let rss = `<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0"
xmlns:content="http://purl.org/rss/1.0/modules/content/"
xmlns:atom="http://www.w3.org/2005/Atom">


<channel>


<title>
Rüya Tabirleri RSS
</title>


<link>
${BASE}/Ruya-Tabirleri
</link>


<description>
Rüya Yorumları
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



console.log("✅ Rüya RSS hazır");

}



rssOlustur();
