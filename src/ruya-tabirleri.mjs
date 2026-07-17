import fs from "fs";

const BASE_URL = "https://www.diyadinnet.com";
const CATEGORY_URL = "https://www.diyadinnet.com/Ruya-Tabirleri";

const RSS_URL =
"https://gizlivadinet-creator.github.io/ruya-tabirleri/ruya-tabirleri.xml";


const USER_AGENT =
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";



async function fetchHTML(url){

const res = await fetch(url,{
headers:{
"User-Agent":USER_AGENT,
"Accept":"text/html"
}
});


if(!res.ok)
throw new Error(url+" "+res.status);


return await res.text();

}



function temizle(html){

return html

.replace(/<script[\s\S]*?<\/script>/gi,"")

.replace(/<style[\s\S]*?<\/style>/gi,"")

.replace(/<!--[\s\S]*?-->/g,"")

.replace(/class="[^"]*"/gi,"")

.replace(/style="[^"]*"/gi,"");

}




function baslikBul(html){

let x =
html.match(
/<h1[^>]*>([\s\S]*?)<\/h1>/i
);


return x
?
x[1].replace(/<[^>]+>/g,"").trim()
:
"Rüya Yorumu";


}




function resimBul(html){


let x =
html.match(
/<img[^>]+src=["']([^"']+)["']/i
);


if(!x)
return "";


if(x[1].startsWith("/"))
return BASE_URL+x[1];


return x[1];

}




function makaleBul(html){


let x =
html.match(
/property=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/i
);



if(!x)
return "";



let body=x[1];



body =
body

.replace(/<a[\s\S]*?>/gi,"")

.replace(/<\/a>/gi,"")

.replace(/<svg[\s\S]*?<\/svg>/gi,"")

.replace(/<i[\s\S]*?<\/i>/gi,"")

.replace(/<button[\s\S]*?<\/button>/gi,"")

.replace(/<ul[\s\S]*?<\/ul>/gi,"")

.replace(/<div[^>]*>/gi,"")

.replace(/<\/div>/gi,"");



// sadece içerik tagları

body =
body.replace(
/<(?!\/?(p|h2|h3|strong|br)\b)[^>]+>/gi,
""
);



return body.trim();

}





function videoBul(html){


let x =
html.match(
/<iframe[^>]+src=["']([^"']+)["']/i
);


if(!x)
return "";


return `

<br>

<h2>Video</h2>

<iframe src="${x[1]}" frameborder="0" allowfullscreen></iframe>

`;

}





function xmlEscape(t=""){

return t

.replace(/&/g,"&amp;")

.replace(/</g,"&lt;")

.replace(/>/g,"&gt;");

}





async function linkleriBul(){


let html =
await fetchHTML(CATEGORY_URL);



let links =
[
...html.matchAll(
/href=["'](\/ruyada-[^"']+)["']/gi
)

]

.map(x=>BASE_URL+x[1]);



return [...new Set(links)];

}





async function main(){


let links =
await linkleriBul();



console.log(
"Bulunan rüya:",
links.length
);



let items="";



for(const link of links){


try{


let html =
await fetchHTML(link);



let title =
baslikBul(html);



let image =
resimBul(html);



let article =
makaleBul(html);



let video =
videoBul(html);



if(!article)
continue;



items += `

<item>


<title><![CDATA[
${title}
]]></title>



<description><![CDATA[
${title}
]]></description>



<content:encoded><![CDATA[


${image ?
`<img src="${image}" /><br/><br/>`
:""}



<h1>
${title}
</h1>


${article}


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



}catch(e){

console.log(
"Hata:",
link,
e.message
);

}


}





const rss = `<?xml version="1.0" encoding="UTF-8"?>


<rss version="2.0"

xmlns:content="http://purl.org/rss/1.0/modules/content/"

xmlns:atom="http://www.w3.org/2005/Atom">


<channel>


<title>
Rüya Tabirleri RSS
</title>


<link>
${CATEGORY_URL}
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



console.log(
"✅ RSS oluşturuldu"
);


}



main();
