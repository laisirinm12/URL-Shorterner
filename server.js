const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const urlsFile = "urls.json";

function readUrlStore() {
    try {
        const raw = fs.readFileSync(urlsFile, "utf8").trim();
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        return {};
    }
}

function writeUrlStore(data) {
    fs.writeFileSync(urlsFile, JSON.stringify(data, null, 2));
}

/* ---------- CLEAN EXPIRED LINKS ---------- */

function cleanExpiredLinks(){

const data = readUrlStore();

let changed = false;

for(const code in data){

if(data[code].expiresAt && Date.now() > data[code].expiresAt){

delete data[code];
changed = true;

}

}

if(changed){
writeUrlStore(data);
}

}

/* run cleanup every minute */

setInterval(cleanExpiredLinks,60000);

/* ---------- GENERATE SHORT CODE ---------- */

function generateCode(){

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

let code = "";

for(let i = 0; i < 6; i++){

code += chars[Math.floor(Math.random() * chars.length)];

}

return code;

}

/* ---------- CREATE SHORT LINK ---------- */

app.post("/shorten",(req,res)=>{

const { url, customCode, expiryDays } = req.body;

if(!url){
return res.status(400).json({error:"URL is required"});
}

const data = readUrlStore();

let code;

if(customCode){

if(data[customCode]){
return res.status(400).json({error:"Short code already exists"});
}

code = customCode;

}else{

do{
code = generateCode();
}while(data[code]);

}

/* expiration calculation */

let expiresAt = null;

if(expiryDays && Number(expiryDays) > 0){
expiresAt = Date.now() + (Number(expiryDays) * 24 * 60 * 60 * 1000);
}

/* store link */

data[code] = {
url: url,
clicks: 0,
expiresAt: expiresAt
};

writeUrlStore(data);

res.json({
shortUrl: "http://localhost:3000/" + code
});

});

/* ---------- ADMIN DASHBOARD DATA ---------- */

app.get("/admin",(req,res)=>{

cleanExpiredLinks();

const data = readUrlStore();

res.json(data);

});

/* ---------- DELETE LINK ---------- */

app.delete("/delete/:code",(req,res)=>{

const code = req.params.code;

const data = readUrlStore();

if(!data[code]){
return res.status(404).json({error:"Link not found"});
}

delete data[code];

writeUrlStore(data);

res.json({message:"Deleted successfully"});

});

/* ---------- REDIRECT SHORT LINK ---------- */

app.get("/:code",(req,res)=>{

cleanExpiredLinks();

const code = req.params.code;

const data = readUrlStore();

const entry = data[code];

if(entry){

entry.clicks += 1;

writeUrlStore(data);

res.redirect(entry.url);

}else{

res.send("URL not found or expired");

}

});

/* ---------- SERVER START ---------- */

const PORT = 3000;

app.listen(PORT,()=>{
console.log("Server running on port "+PORT);
});